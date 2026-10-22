import type { ResearchCategory, ResearchNodeDefinition } from '../core/research'
import type { TechEffect } from '../core/techModifiers'
import { FREE_UNTIL_YEAR, bodyItem, engineItem, needsResearch, partItem, unlockNodeId } from '../core/unlocks'
import { DESIGN_STEPS } from './designSteps'
import { ENGINE_PRESETS } from './enginePresets'
import { BODIES } from './bodies'

interface NodeSpec {
  name: string
  category: ResearchCategory
  /** The year this becomes normal (cheaper) research; up to 8 years earlier it is a breakthrough. */
  year: number
  effects: TechEffect[]
  /** Name of the card (same tab) that must be researched first. */
  requires?: string
  /** Names of cards (same tab) that are a different choice: researching one closes the other. */
  excludes?: string[]
}

const P = (target: TechEffect['target'], amount: number): TechEffect => ({ target, amount })

/** Stat upgrades, as a tree: each card can need one earlier card, so the tabs branch, and a few
 * pairs are a choice - researching one closes the other for good. Every card makes every car
 * designed afterwards a little better or cheaper. (Appearance and Interior hold only part
 * unlocks.) Ids are slug(tab)-slug(name) and are saved - never rename. */
const STAT_NODES: NodeSpec[] = [
  // Engine
  { name: 'Engine Material', category: 'Engine', year: 1970, effects: [P('Power', 0.04)] },
  { name: 'Fuel System', category: 'Engine', year: 1970, effects: [P('FuelEconomy', 0.06)] },
  { name: 'Pistons', category: 'Engine', year: 1972, effects: [P('Reliability', 0.02)], requires: 'Engine Material' },
  { name: 'Cylinder Head Material', category: 'Engine', year: 1976, effects: [P('Power', 0.03)], requires: 'Engine Material' },
  { name: 'Crankshaft', category: 'Engine', year: 1978, effects: [P('Reliability', 0.02)], requires: 'Pistons' },
  { name: 'Performance Tuning', category: 'Engine', year: 1980, effects: [P('Power', 0.06), P('Reliability', -0.01)], requires: 'Engine Material', excludes: ['Efficiency Tuning'] },
  { name: 'Efficiency Tuning', category: 'Engine', year: 1980, effects: [P('FuelEconomy', 0.08), P('Emissions', -0.05)], requires: 'Fuel System', excludes: ['Performance Tuning'] },
  { name: 'Exhaust Gas Recirculation', category: 'Engine', year: 1990, effects: [P('Emissions', -0.15)], requires: 'Fuel System' },
  { name: 'Direct Injection', category: 'Engine', year: 2006, effects: [P('Emissions', -0.15)], requires: 'Fuel System' },
  // Bodies
  { name: 'Aerodynamic Shell', category: 'Bodies', year: 1972, effects: [P('FuelEconomy', 0.04)] },
  { name: 'Lightweight Chassis', category: 'Bodies', year: 1975, effects: [P('ProductionCost', -0.03)] },
  { name: 'Reinforced Frame', category: 'Bodies', year: 1978, effects: [P('Reliability', 0.02)] },
  { name: 'Mass Production Tooling', category: 'Bodies', year: 1985, effects: [P('ProductionCost', -0.06)], requires: 'Lightweight Chassis', excludes: ['Premium Craftsmanship'] },
  { name: 'Premium Craftsmanship', category: 'Bodies', year: 1985, effects: [P('Reliability', 0.04), P('ProductionCost', 0.03)], requires: 'Reinforced Frame', excludes: ['Mass Production Tooling'] },
  { name: 'Modular Platform', category: 'Bodies', year: 1990, effects: [P('ProductionCost', -0.05)], requires: 'Lightweight Chassis' },
  // Undercarriage
  { name: 'Suspension Tuning', category: 'Undercarriage', year: 1972, effects: [P('Reliability', 0.02)] },
  { name: 'Anti-Roll Bars', category: 'Undercarriage', year: 1978, effects: [P('Reliability', 0.02)], requires: 'Suspension Tuning' },
  { name: 'Independent Rear Suspension', category: 'Undercarriage', year: 1982, effects: [P('Reliability', 0.03)], requires: 'Suspension Tuning' },
  // Safety
  { name: 'Seatbelt Pretensioners', category: 'Safety', year: 1974, effects: [P('RepairCost', -0.02)] },
  { name: 'ABS Braking', category: 'Safety', year: 1994, effects: [P('Reliability', 0.02)], requires: 'Seatbelt Pretensioners' },
  { name: 'Stability Control', category: 'Safety', year: 1996, effects: [P('Reliability', 0.03)], requires: 'ABS Braking' },
]

/** Which research tab each design step's part unlocks live in. */
const STEP_CATEGORY: Record<string, ResearchCategory> = {
  Safety: 'Safety',
  EngineTuning: 'Engine',
  EngineBuild: 'Engine',
  Transmission: 'Undercarriage',
  Undercarriage: 'Undercarriage',
  Tires: 'Undercarriage',
  Appearance: 'Appearance',
  Interior: 'Interior',
  Aerodynamics: 'Bodies',
}

/** Research card names for parts whose designer label alone would be unclear ("Sport"). */
const PART_NAMES: Record<string, string> = {
  'forced-induction.turbocharger': 'Turbocharger',
  'forced-induction.supercharger': 'Supercharger',
  'forced-induction.twin-turbo': 'Twin Turbo',
  'camshaft.sport-cam': 'Sport Camshaft',
  'camshaft.racing-cam': 'Racing Camshaft',
  'camshaft.variable-valve': 'Variable Valve Timing',
  'cooling.performance-cooling': 'Performance Cooling',
  'engine-type.flat': 'Boxer Engine Layout',
  'engine-material.aluminum': 'Aluminum Engine Block',
  'head-material.aluminum': 'Aluminum Cylinder Head',
  'pistons.forged': 'Forged Pistons',
  'conrods.forged': 'Forged Conrods',
  'crankshaft.lightweight': 'Lightweight Crankshaft',
  'valves.v3': 'Three Valves per Cylinder',
  'valves.v4': 'Four Valves per Cylinder',
  'valves.v5': 'Five Valves per Cylinder',
  'fuel-system.injection': 'Fuel Injection',
  'fuel-system.direct-injection': 'Direct Fuel Injection',
  'intake.ram-air': 'Ram Air Intake',
  'manifold.tubular': 'Tubular Exhaust Manifold',
  'muffler.straight-pipe': 'Straight-Pipe Muffler',
  'exhaust.catalytic': 'Catalytic Converter',
  'exhaust.performance-headers': 'Performance Headers',
  'suspension.sport': 'Sport Suspension',
  'suspension.adaptive': 'Adaptive Suspension',
  'brakes.disc-all-round': 'All-Round Disc Brakes',
  'brakes.performance': 'Performance Brakes',
  'paint-finish.pearlescent': 'Pearlescent Paint',
  'paint-finish.matte': 'Matte Paint',
  'wheel-style.sport-alloy': 'Sport Alloy Wheels',
  'wheel-style.custom-forged': 'Forged Wheels',
  'aero-package.sport-kit': 'Sport Aero Kit',
  'aero-package.track-kit': 'Track Aero Kit',
  'gearbox-type.dual-clutch': 'Dual-Clutch Gearbox',
  'interior-material.leatherette': 'Leatherette Interior',
  'interior-material.leather': 'Leather Interior',
  'interior-material.premium-leather': 'Premium Leather Interior',
  'body-material.composite': 'Composite Body',
  'body-material.carbon-fiber': 'Carbon Fiber Body',
  'body-material.high-strength-steel': 'High-Strength Steel Body',
}

const roundTo100K = (v: number) => Math.round(v / 100_000) * 100_000
const yearsIn = (year: number) => Math.max(0, year - FREE_UNTIL_YEAR)

/** One research card per part, engine and body that appears after the game starts. Parts in the
 * same slot are chained (Dual Front Airbags before Full Curtain Airbags). Later, pricier parts
 * cost more money and research points. */
function buildUnlockNodes(): ResearchNodeDefinition[] {
  const nodes: ResearchNodeDefinition[] = []

  for (const step of DESIGN_STEPS) {
    for (const slot of step.slots) {
      let previousId: string | null = null
      for (const option of [...slot.options].sort((a, b) => a.unlockYear - b.unlockYear)) {
        const item = partItem(slot.id, option)
        if (!needsResearch(item)) continue
        const id = unlockNodeId(item)
        nodes.push({
          id,
          displayName: PART_NAMES[item.id] ?? option.label,
          category: STEP_CATEGORY[step.id] ?? 'Bodies',
          availableYear: option.unlockYear,
          prerequisiteId: previousId,
          scienceCost: 30 + Math.round(yearsIn(option.unlockYear) * 1.5),
          moneyCost: roundTo100K(1_000_000 + option.costDelta * 1_500),
          durationDays: 10 + Math.round(yearsIn(option.unlockYear) / 4),
          effects: [],
          unlocks: item,
        })
        previousId = id
      }
    }
  }

  for (const preset of ENGINE_PRESETS) {
    const item = engineItem(preset)
    if (!needsResearch(item)) continue
    nodes.push({
      id: unlockNodeId(item),
      displayName: preset.name,
      category: 'Engine',
      availableYear: preset.unlockYear,
      prerequisiteId: null,
      scienceCost: 60 + yearsIn(preset.unlockYear) * 2,
      moneyCost: roundTo100K(4_000_000 + yearsIn(preset.unlockYear) * 100_000),
      durationDays: 25,
      effects: [],
      unlocks: item,
    })
  }

  for (const body of BODIES) {
    const item = bodyItem(body)
    if (!needsResearch(item)) continue
    nodes.push({
      id: unlockNodeId(item),
      displayName: body.displayName,
      category: 'Bodies',
      availableYear: body.unlockYear,
      prerequisiteId: null,
      scienceCost: 50 + yearsIn(body.unlockYear) * 2,
      moneyCost: roundTo100K(2_000_000 + body.productionEquipmentCost * 0.5),
      durationDays: 20,
      effects: [],
      unlocks: item,
    })
  }

  return nodes
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function buildResearchNodes(): ResearchNodeDefinition[] {
  const idOf = (spec: Pick<NodeSpec, 'category' | 'name'>) => `${slug(spec.category)}-${slug(spec.name)}`
  const idByName = (category: ResearchCategory, name: string) => idOf({ category, name })

  return STAT_NODES.map((spec) => {
    const yearsIn = Math.max(0, spec.year - FREE_UNTIL_YEAR)
    return {
      id: idOf(spec),
      displayName: spec.name,
      category: spec.category,
      availableYear: spec.year,
      prerequisiteId: spec.requires ? idByName(spec.category, spec.requires) : null,
      excludes: spec.excludes?.map((name) => idByName(spec.category, name)),
      scienceCost: 30 + Math.round(yearsIn * 1.5),
      moneyCost: roundTo100K(1_500_000 + yearsIn * 100_000),
      durationDays: 8 + Math.round(yearsIn / 4),
      effects: spec.effects,
    }
  })
}

/** Stat upgrade tree plus one unlock card per post-1970 part, engine and body. */
export const RESEARCH_NODES: ResearchNodeDefinition[] = [...buildResearchNodes(), ...buildUnlockNodes()]
