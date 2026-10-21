import type { ResearchCategory, ResearchNodeDefinition } from '../core/research'
import type { TechEffect } from '../core/techModifiers'
import { FREE_UNTIL_YEAR, bodyItem, engineItem, needsResearch, partItem, unlockNodeId } from '../core/unlocks'
import { DESIGN_STEPS } from './designSteps'
import { ENGINE_PRESETS } from './enginePresets'
import { BODIES } from './bodies'

interface NodeSpec {
  name: string
  effect: TechEffect
}

/** Stat upgrades - each makes every car designed afterwards a little better or cheaper. (The
 * Appearance and Interior tabs hold only part unlocks.) */
const BY_CATEGORY: Partial<Record<ResearchCategory, NodeSpec[]>> = {
  Engine: [
    { name: 'Engine Material', effect: { target: 'Power', amount: 0.04 } },
    { name: 'Cylinder Head Material', effect: { target: 'Power', amount: 0.03 } },
    { name: 'Pistons', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Crankshaft', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Fuel System', effect: { target: 'FuelEconomy', amount: 0.06 } },
  ],
  Bodies: [
    { name: 'Aerodynamic Shell', effect: { target: 'FuelEconomy', amount: 0.04 } },
    { name: 'Lightweight Chassis', effect: { target: 'ProductionCost', amount: -0.03 } },
    { name: 'Reinforced Frame', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Modular Platform', effect: { target: 'ProductionCost', amount: -0.05 } },
  ],
  Undercarriage: [
    { name: 'Suspension Tuning', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Independent Rear Suspension', effect: { target: 'Reliability', amount: 0.03 } },
    { name: 'Anti-Roll Bars', effect: { target: 'Reliability', amount: 0.02 } },
  ],
  Safety: [
    { name: 'Seatbelt Pretensioners', effect: { target: 'RepairCost', amount: -0.02 } },
    { name: 'ABS Braking', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Stability Control', effect: { target: 'Reliability', amount: 0.03 } },
  ],
}

/** Emission-cutting research, timed for the emission laws in data/historyEvents.ts. Not chained. */
const EMISSIONS_NODES: (NodeSpec & { year: number })[] = [
  { name: 'Exhaust Gas Recirculation', effect: { target: 'Emissions', amount: -0.15 }, year: 1990 },
  { name: 'Direct Injection', effect: { target: 'Emissions', amount: -0.15 }, year: 2006 },
]

/** Which research tab each design step's part unlocks live in. */
const STEP_CATEGORY: Record<string, ResearchCategory> = {
  Safety: 'Safety',
  EngineTuning: 'Engine',
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
  const nodes: ResearchNodeDefinition[] = []
  let year = 1968
  let index = 0

  for (const [category, specs] of Object.entries(BY_CATEGORY) as [ResearchCategory, NodeSpec[]][]) {
    let previousId: string | null = null

    for (const spec of specs) {
      const id = `${slug(category)}-${slug(spec.name)}`
      nodes.push({
        id,
        displayName: spec.name,
        category,
        availableYear: year,
        prerequisiteId: previousId,
        scienceCost: 30 + (index % 5) * 10,
        moneyCost: 1_500_000 + (index % 6) * 600_000,
        durationDays: 8 + (index % 4) * 2,
        effects: [spec.effect],
      })

      previousId = id
      year += 2
      index += 1
    }
  }

  for (const spec of EMISSIONS_NODES) {
    nodes.push({
      id: `engine-${slug(spec.name)}`,
      displayName: spec.name,
      category: 'Engine',
      availableYear: spec.year,
      prerequisiteId: null,
      scienceCost: 40 + Math.round((spec.year - 1970) * 1.5),
      moneyCost: 2_000_000 + (spec.year - 1970) * 50_000,
      durationDays: 15,
      effects: [spec.effect],
    })
  }

  return nodes
}

/** Stat upgrades (chained within each tab, spread 1968 onward) plus one unlock card per post-1970
 * part, engine and body. */
export const RESEARCH_NODES: ResearchNodeDefinition[] = [...buildResearchNodes(), ...buildUnlockNodes()]
