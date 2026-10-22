import { calculateCarSpecs } from './carSpecsCalculator'
import { engineItem, type UnlockCheck } from './unlocks'
import type { TechModifiers } from './techModifiers'
import type { BodyStyleDefinition, EngineSpec } from './vehicles'
import { findDesignStep, type ComponentOption, type ComponentSlot } from '../data/designSteps'
import { ENGINE_PRESETS } from '../data/enginePresets'

/** What the engine builder lets the player pick, on top of the part slots in data/designSteps.ts. */
export type FuelGrade = 'regular' | 'premium' | 'diesel' | 'electric'
export const FUEL_GRADES: FuelGrade[] = ['regular', 'premium', 'diesel', 'electric']

/** An engine the player has built. It is saved in the company's engine library and a car design
 * picks one from there. Plain JSON. */
export interface EngineBuild {
  id: string
  name: string
  cylinders: number
  /** Piston diameter and stroke in millimetres - together with the cylinder count they set the size. */
  boreMm: number
  strokeMm: number
  fuel: FuelGrade
  rpmLimit: number
  /** How rich the fuel mixture is, 0-40 (20 is normal). */
  fuelMixturePct: number
  /** The chosen option id for every part slot the builder shows (see BUILD_SLOT_IDS). */
  parts: Record<string, string>
}

export const CYLINDER_OPTIONS = [3, 4, 5, 6, 8, 10, 12]
export const BORE_RANGE = { min: 60, max: 110 }
export const STROKE_RANGE = { min: 50, max: 110 }
export const RPM_RANGE = { min: 3000, max: 9000, step: 100 }
export const MIXTURE_RANGE = { min: 0, max: 40 }

/** Every part slot the builder shows, in the order of the builder's sections. Bore & stroke are
 * set from the two size sliders instead (see boreStrokeOption). */
export const BUILD_SLOT_IDS = [
  'engine-type',
  'engine-material',
  'head-material',
  'cooling',
  'pistons',
  'conrods',
  'crankshaft',
  'camshaft',
  'valves',
  'fuel-system',
  'intake',
  'forced-induction',
  'turbo-setup',
  'turbo-preset',
  'exhaust',
  'manifold',
  'muffler',
] as const

/** The boost slots only matter when an engine has forced induction. */
const BOOST_ONLY_SLOTS = new Set(['turbo-setup', 'turbo-preset'])

export function buildSlot(slotId: string): ComponentSlot | undefined {
  for (const stepId of ['EngineBuild', 'EngineTuning']) {
    const slot = findDesignStep(stepId)?.slots.find((s) => s.id === slotId)
    if (slot) return slot
  }
  return undefined
}

/** Total engine size in litres from cylinders, bore and stroke: pi/4 x bore^2 x stroke x cylinders. */
export function displacementLiters(cylinders: number, boreMm: number, strokeMm: number): number {
  const bore = boreMm / 10
  const stroke = strokeMm / 10
  return (cylinders * Math.PI * bore * bore * stroke) / 4 / 1000
}

export function buildLiters(build: EngineBuild): number {
  return build.fuel === 'electric' ? 0.3 : displacementLiters(build.cylinders, build.boreMm, build.strokeMm)
}

/** A sensible first engine: a 1.4 litre inline four on basic parts. */
export function defaultBuild(id: string): EngineBuild {
  const parts: Record<string, string> = {}
  for (const slotId of BUILD_SLOT_IDS) parts[slotId] = buildSlot(slotId)?.options[0].id ?? ''
  return { id, name: '', cylinders: 4, boreMm: 76, strokeMm: 78, fuel: 'regular', rpmLimit: 6000, fuelMixturePct: 20, parts }
}

export interface EngineLimits {
  cylinderOptions: number[]
  /** The biggest engine allowed: what research has unlocked, capped by the body's engine bay. */
  maxLiters: number
  diesel: boolean
  electric: boolean
}

/** What the player may build now. The engine presets (data/enginePresets.ts) are the research
 * milestones: each one researched raises the most cylinders, the biggest size, and opens diesel
 * and electric. */
export function engineLimits(isUnlocked: UnlockCheck, bayLiters: number): EngineLimits {
  const open = ENGINE_PRESETS.filter((p) => isUnlocked(engineItem(p)))
  const fuelled = open.filter((p) => p.spec.fuelType !== 'Electric')
  const maxCylinders = Math.max(3, ...fuelled.map((p) => p.spec.cylinders))
  const maxLiters = Math.max(1, ...fuelled.map((p) => p.spec.displacementLiters))
  return {
    cylinderOptions: CYLINDER_OPTIONS.filter((c) => c <= maxCylinders),
    maxLiters: Math.min(bayLiters, maxLiters),
    diesel: open.some((p) => p.spec.fuelType === 'Diesel'),
    electric: open.some((p) => p.spec.fuelType === 'Electric'),
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Fixes a build so it follows the limits: allowed cylinder count and fuel, sliders in range and
 * the engine no bigger than the limit (the piston diameter shrinks first, then the stroke). */
export function clampBuild(build: EngineBuild, limits: EngineLimits): EngineBuild {
  const next = { ...build, parts: { ...build.parts } }
  const allowed = limits.cylinderOptions
  if (!allowed.includes(next.cylinders)) {
    next.cylinders = allowed.filter((c) => c <= next.cylinders).pop() ?? allowed[0]
  }
  if (next.fuel === 'diesel' && !limits.diesel) next.fuel = 'regular'
  if (next.fuel === 'electric' && !limits.electric) next.fuel = 'regular'
  next.boreMm = clamp(Math.round(next.boreMm), BORE_RANGE.min, BORE_RANGE.max)
  next.strokeMm = clamp(Math.round(next.strokeMm), STROKE_RANGE.min, STROKE_RANGE.max)
  next.rpmLimit = clamp(Math.round(next.rpmLimit / RPM_RANGE.step) * RPM_RANGE.step, RPM_RANGE.min, RPM_RANGE.max)
  next.fuelMixturePct = clamp(Math.round(next.fuelMixturePct), MIXTURE_RANGE.min, MIXTURE_RANGE.max)
  while (displacementLiters(next.cylinders, next.boreMm, next.strokeMm) > limits.maxLiters && next.boreMm > BORE_RANGE.min) next.boreMm -= 1
  while (displacementLiters(next.cylinders, next.boreMm, next.strokeMm) > limits.maxLiters && next.strokeMm > STROKE_RANGE.min) next.strokeMm -= 1
  return next
}

function valvesPerCylinder(build: EngineBuild): number {
  const id = build.parts.valves ?? 'v2'
  return Number(id.replace('v', '')) || 2
}

/** The EngineSpec the car calculator needs. Forced induction is applied by its part option. */
export function specOfBuild(build: EngineBuild): EngineSpec {
  if (build.fuel === 'electric') {
    return { displacementLiters: 0.3, cylinders: 0, aspiration: 'NaturallyAspirated', fuelType: 'Electric', valveCount: 0 }
  }
  return {
    displacementLiters: Math.round(buildLiters(build) * 100) / 100,
    cylinders: build.cylinders,
    aspiration: 'NaturallyAspirated',
    fuelType: build.fuel === 'diesel' ? 'Diesel' : 'Petrol',
    valveCount: build.cylinders * valvesPerCylinder(build),
  }
}

/** Wide pistons rev and make power; long strokes pull and sip fuel - the existing Bore & Stroke slot. */
export function boreStrokeOptionId(build: EngineBuild): string {
  const ratio = build.boreMm / build.strokeMm
  if (ratio > 1.1) return 'wide-bore'
  if (ratio < 0.9) return 'long-stroke'
  return 'balanced'
}

/** What the sliders and the fuel grade do to the engine, as one extra part. */
function sliderOption(build: EngineBuild): ComponentOption {
  const baseRpm = 6400 - build.cylinders * 160
  const rpmFactor = (build.rpmLimit - 6000) / 3000
  const mix = (build.fuelMixturePct - 20) / 100
  const premium = build.fuel === 'premium'
  return {
    id: 'builder-tuning',
    label: '',
    unlockYear: 1950,
    costDelta: premium ? 150 : 0,
    weightDeltaKg: 0,
    effects: {},
    engine: {
      powerPct: rpmFactor * 0.08 + mix * 0.2 + (premium ? 0.03 : 0),
      reliability: rpmFactor > 0 ? -rpmFactor * 8 : -rpmFactor * 3,
      fuelPct: mix * 0.6,
      emissionsPct: mix * 0.8,
      maxRpm: build.rpmLimit - baseRpm,
    },
  }
}

/** The part options an engine build is made of: its chosen parts, the bore/stroke character and
 * the slider effects. Boost parts only count when the engine has forced induction. */
export function buildOptions(build: EngineBuild): ComponentOption[] {
  if (build.fuel === 'electric') return []
  const options: ComponentOption[] = []
  const boosted = (build.parts['forced-induction'] ?? 'none') !== 'none'
  for (const slotId of BUILD_SLOT_IDS) {
    if (BOOST_ONLY_SLOTS.has(slotId) && !boosted) continue
    const option = buildSlot(slotId)?.options.find((o) => o.id === build.parts[slotId])
    if (option) options.push(option)
  }
  const boreStroke = buildSlot('bore-stroke')?.options.find((o) => o.id === boreStrokeOptionId(build))
  if (boreStroke) options.push(boreStroke)
  options.push(sliderOption(build))
  return options
}

const ENGINE_ONLY_BODY: BodyStyleDefinition = {
  id: 'engine-only',
  displayName: '',
  carClass: 'Sedan',
  engineBayCapacityLiters: 99,
  baseWeightKg: 0,
  productionEquipmentCost: 0,
  baseUnitCost: 0,
  unlockYear: 1950,
}

export interface EngineStats {
  powerHp: number
  torqueNm: number
  torqueRpm: number
  liters: number
  /** 0-100, higher is thriftier. */
  efficiencyPercent: number
  reliabilityPercent: number
  emissionsGKm: number
  repairCost: number
  weightKg: number
  maxRpm: number
  /** What the engine adds to a car's cost. */
  costPrice: number
}

export function computeEngineStats(build: EngineBuild, tech: TechModifiers): EngineStats {
  const spec = specOfBuild(build)
  const options = buildOptions(build)
  const car = calculateCarSpecs(ENGINE_ONLY_BODY, spec, tech, { componentOptions: options, classificationTags: [] })
  const costDelta = options.reduce((sum, o) => sum + o.costDelta, 0)
  const weightDelta = options.reduce((sum, o) => sum + o.weightDeltaKg, 0)
  const forced = options.some((o) => o.engine?.aspiration && o.engine.aspiration !== 'NaturallyAspirated')
  const costCut = tech.get('ProductionCost')
  return {
    powerHp: car.powerHp,
    torqueNm: car.torqueNm,
    torqueRpm: car.torqueRpm,
    liters: spec.displacementLiters,
    efficiencyPercent: spec.fuelType === 'Electric' ? 99 : clamp(Math.round(110 - car.fuelConsumptionL100Km * 8), 5, 99),
    reliabilityPercent: car.reliabilityPercent,
    emissionsGKm: car.emissionsGKm,
    repairCost: car.repairCost,
    weightKg: Math.max(25, spec.cylinders * 22 + spec.displacementLiters * 45 + weightDelta),
    maxRpm: car.maxRpm,
    costPrice: Math.max(100, (car.powerHp * 21 + (forced ? 1200 : 0)) * (1 - costCut) + costDelta),
  }
}

/** A short automatic name for a finished engine, e.g. "I4 1.6L Turbo". */
export function autoEngineName(build: EngineBuild): string {
  if (build.fuel === 'electric') return 'Electric Motor'
  const layout = build.parts['engine-type'] === 'v-type' ? 'V' : build.parts['engine-type'] === 'flat' ? 'F' : 'I'
  const boost = (build.parts['forced-induction'] ?? 'none') === 'none' ? '' : ' Turbo'
  const diesel = build.fuel === 'diesel' ? ' Diesel' : ''
  return `${layout}${build.cylinders} ${buildLiters(build).toFixed(1)}L${boost}${diesel}`
}

/** Writes an engine's part choices into a design's selections (the car calculator reads them
 * from there), with the boost parts reset when there is no forced induction. */
export function selectionsOfBuild(build: EngineBuild): Record<string, string> {
  const selections: Record<string, string> = { ...build.parts, 'bore-stroke': boreStrokeOptionId(build) }
  if (build.fuel === 'electric') for (const slotId of BUILD_SLOT_IDS) selections[slotId] = buildSlot(slotId)?.options[0].id ?? ''
  return selections
}

/** The same as the slider-and-fuel part, for the car calculator (see vehicleService). */
export function extraBuildOption(build: EngineBuild): ComponentOption | null {
  return build.fuel === 'electric' ? null : sliderOption(build)
}

export const BOOST_SLOT_IDS = BOOST_ONLY_SLOTS
