import { calculateCarSpecs, type DesignChoices } from './carSpecsCalculator'
import { tryWithdraw, type BankState } from './economy'
import type { TechModifiers } from './techModifiers'
import {
  createDesignSession,
  type BodyStyleDefinition,
  type CarModel,
  type EngineSpec,
  type ModelDesignSession,
} from './vehicles'
import type { GameDate } from './gameDate'
import { DESIGN_STEPS, defaultOptionId, type ComponentOption } from '../data/designSteps'
import { ENGINE_PRESETS, findEnginePreset } from '../data/enginePresets'
import { findClassificationTag } from '../data/classifications'

/** Owns the player's model lineup and the in-progress design wizard. Direct port of VehicleService.cs. */
export interface VehicleState {
  models: CarModel[]
  tooledBodyIds: string[]
  currentSession: ModelDesignSession | null
}

export function createVehicleState(): VehicleState {
  return { models: [], tooledBodyIds: [], currentSession: null }
}

export function resolveBody(bodies: BodyStyleDefinition[], model: CarModel): BodyStyleDefinition | undefined {
  return bodies.find((b) => b.id === model.bodyStyleId)
}

export function isBodyTooled(vehicles: VehicleState, bodyId: string): boolean {
  return vehicles.tooledBodyIds.includes(bodyId)
}

export function beginNewDesign(vehicles: VehicleState): void {
  vehicles.currentSession = createDesignSession()
}

export function beginRestyling(vehicles: VehicleState, source: CarModel): void {
  vehicles.currentSession = {
    ...createDesignSession(),
    selectedBodyId: source.bodyStyleId,
    engine: { ...source.engine },
    enginePresetId: source.enginePresetId,
    classificationTagIds: [...source.classificationTagIds],
    componentSelections: { ...source.componentSelections },
    categoryTag: source.categoryTag,
    sourceModelId: source.id,
  }
}

/** Picks the best-fit preset engine for a body's bay capacity and the current year - the largest-
 * displacement preset that both fits and is unlocked, falling back to the smallest-displacement
 * preset overall if somehow none qualify (shouldn't happen: economy-i3 unlocks in 1950 and fits
 * every body). Must exclude locked presets - ComponentSlotCard only cycles through unlocked
 * options, so defaulting to a locked one would leave the Engine step's card showing a different
 * engine than the one actually committed to the session. */
function defaultEnginePresetFor(body: BodyStyleDefinition, currentYear: number) {
  const candidates = ENGINE_PRESETS.filter(
    (p) => p.spec.displacementLiters <= body.engineBayCapacityLiters && p.unlockYear <= currentYear,
  )
  const sorted = [...candidates].sort((a, b) => b.spec.displacementLiters - a.spec.displacementLiters)
  if (sorted.length > 0) return sorted[0]
  return [...ENGINE_PRESETS].sort((a, b) => a.spec.displacementLiters - b.spec.displacementLiters)[0]
}

/** Selects a body for the current session, charging the one-time tooling cost the first time this
 * body is used, and seeding sane defaults (first option in every component slot, a best-fit
 * preset engine) so the rest of the wizard has valid values to preview immediately. */
export function selectBody(vehicles: VehicleState, body: BodyStyleDefinition, bank: BankState, currentYear: number): boolean {
  if (!vehicles.currentSession) beginNewDesign(vehicles)

  if (!isBodyTooled(vehicles, body.id)) {
    if (!tryWithdraw(bank, body.productionEquipmentCost)) return false
    vehicles.tooledBodyIds.push(body.id)
  }

  const session = vehicles.currentSession!
  session.selectedBodyId = body.id

  for (const step of DESIGN_STEPS) {
    for (const slot of step.slots) {
      if (!(slot.id in session.componentSelections)) {
        session.componentSelections[slot.id] = defaultOptionId(slot)
      }
    }
  }

  // Re-validate the committed engine preset against this body, not just "is one set" - restyling
  // into a smaller-bay body (or one where the preset has since been out-leveled by the year) can
  // leave a stale, no-longer-fitting preset committed to session.engine while the Engine step's
  // card - which filters its options by this same body - silently shows a different one instead.
  const existingPreset = session.enginePresetId ? findEnginePreset(session.enginePresetId) : undefined
  const existingPresetStillFits =
    existingPreset !== undefined &&
    existingPreset.spec.displacementLiters <= body.engineBayCapacityLiters &&
    existingPreset.unlockYear <= currentYear
  if (!existingPresetStillFits) {
    const preset = defaultEnginePresetFor(body, currentYear)
    session.enginePresetId = preset.id
    session.engine = { ...preset.spec }
  }

  return true
}

export function toggleClassificationTag(vehicles: VehicleState, tagId: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  const session = vehicles.currentSession!
  if (session.classificationTagIds.includes(tagId)) {
    session.classificationTagIds = session.classificationTagIds.filter((id) => id !== tagId)
  } else if (session.classificationTagIds.length < 2) {
    session.classificationTagIds = [...session.classificationTagIds, tagId]
  }
  // Already have 2 tags and this one isn't among them - ignore, matching the reference's 2-slot picker.
}

export function setComponentSelection(vehicles: VehicleState, slotId: string, optionId: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.componentSelections[slotId] = optionId
}

export function setEnginePreset(vehicles: VehicleState, presetId: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  const preset = findEnginePreset(presetId)
  if (!preset) return
  vehicles.currentSession!.enginePresetId = preset.id
  vehicles.currentSession!.engine = { ...preset.spec }
}

/** Sets the session's engine directly, bypassing the preset carousel. Kept for tests and any
 * future custom-engine path; the wizard UI itself only calls setEnginePreset. */
export function setEngineSpec(vehicles: VehicleState, spec: EngineSpec): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.engine = spec
}

export function setNameAndCategory(vehicles: VehicleState, name: string, categoryTag: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.name = name
  vehicles.currentSession!.categoryTag = categoryTag
}

export function setCustomPrice(vehicles: VehicleState, price: number): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.customPrice = price
}

/** Resolves a session's stored ids (component selections + classification tags) into the
 * definitions calculateCarSpecs needs. Unrecognized/unset ids are simply skipped. */
function resolveDesignChoices(session: ModelDesignSession): DesignChoices {
  const componentOptions: ComponentOption[] = []
  for (const step of DESIGN_STEPS) {
    for (const slot of step.slots) {
      const optionId = session.componentSelections[slot.id]
      const option = slot.options.find((o) => o.id === optionId)
      if (option) componentOptions.push(option)
    }
  }

  const classificationTags = session.classificationTagIds
    .map((id) => findClassificationTag(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  return { componentOptions, classificationTags }
}

export function previewCurrentStats(
  vehicles: VehicleState,
  bodies: BodyStyleDefinition[],
  tech: TechModifiers,
) {
  const session = vehicles.currentSession
  if (!session?.selectedBodyId) return null
  const body = bodies.find((b) => b.id === session.selectedBodyId)
  if (!body) return null
  return calculateCarSpecs(body, session.engine, tech, resolveDesignChoices(session))
}

let modelIdCounter = 0
function nextModelId(): string {
  modelIdCounter += 1
  return `model-${Date.now().toString(36)}-${modelIdCounter}`
}

/** Completes the wizard, creating a sellable CarModel from the session in progress. */
export function finalizeDesign(
  vehicles: VehicleState,
  bodies: BodyStyleDefinition[],
  tech: TechModifiers,
  today: GameDate,
  maxProductionBatch: number,
): CarModel | null {
  const session = vehicles.currentSession
  if (!session || !session.selectedBodyId || !session.name.trim()) return null

  const body = bodies.find((b) => b.id === session.selectedBodyId)
  if (!body) return null

  const stats = calculateCarSpecs(body, session.engine, tech, resolveDesignChoices(session))
  const model: CarModel = {
    id: nextModelId(),
    name: session.name,
    bodyStyleId: body.id,
    categoryTag: session.categoryTag,
    engine: session.engine,
    enginePresetId: session.enginePresetId,
    classificationTagIds: session.classificationTagIds,
    componentSelections: session.componentSelections,
    stats,
    issueDate: today,
    unitCost: stats.unitCost,
    salePrice: session.customPrice ?? stats.suggestedPrice,
    plannedProductionRun: maxProductionBatch,
    inventory: 0,
    totalProduced: 0,
    totalSold: 0,
    lifetimeEarnings: 0,
    isOnSale: true,
    currentDailySalesRatePercent: 0,
    lastDayUnitsSold: 0,
    lastDayRevenue: 0,
    marketingActive: false,
    marketingDaysRemaining: 0,
    marketingEfficiencyMultiplier: 1,
  }

  vehicles.models.push(model)
  vehicles.currentSession = null
  return model
}

export function setOnSale(model: CarModel, onSale: boolean): void {
  model.isOnSale = onSale
}

export function setSalePrice(model: CarModel, price: number): void {
  model.salePrice = price
}

export function extendProductionRun(model: CarModel, additionalUnits: number): void {
  if (additionalUnits <= 0) return
  model.plannedProductionRun += additionalUnits
}
