import type { ResearchCategory, ResearchNodeDefinition } from '../core/research'
import type { TechEffect } from '../core/techModifiers'

interface NodeSpec {
  name: string
  effect: TechEffect
}

const BY_CATEGORY: Record<ResearchCategory, NodeSpec[]> = {
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
    { name: 'Composite Panels', effect: { target: 'ProductionCost', amount: -0.04 } },
    { name: 'Reinforced Frame', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Modular Platform', effect: { target: 'ProductionCost', amount: -0.05 } },
  ],
  Undercarriage: [
    { name: 'Suspension Tuning', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Disc Brakes', effect: { target: 'RepairCost', amount: -0.04 } },
    { name: 'Alloy Wheels', effect: { target: 'ProductionCost', amount: -0.02 } },
    { name: 'Independent Rear Suspension', effect: { target: 'Reliability', amount: 0.03 } },
    { name: 'Anti-Roll Bars', effect: { target: 'Reliability', amount: 0.02 } },
  ],
  Appearance: [
    { name: 'Two-Tone Paint', effect: { target: 'ProductionCost', amount: 0.01 } },
    { name: 'Chrome Trim', effect: { target: 'ProductionCost', amount: 0.01 } },
    { name: 'LED Headlights', effect: { target: 'ProductionCost', amount: -0.01 } },
    { name: 'Alloy Rims', effect: { target: 'ProductionCost', amount: -0.01 } },
    { name: 'Custom Livery', effect: { target: 'ProductionCost', amount: 0.01 } },
  ],
  Interior: [
    { name: 'Leather Seats', effect: { target: 'ProductionCost', amount: 0.01 } },
    { name: 'Climate Control', effect: { target: 'ProductionCost', amount: 0.01 } },
    { name: 'Sound Insulation', effect: { target: 'Reliability', amount: 0.01 } },
    { name: 'Digital Dashboard', effect: { target: 'ProductionCost', amount: -0.01 } },
    { name: 'Premium Audio', effect: { target: 'ProductionCost', amount: 0.01 } },
  ],
  Safety: [
    { name: 'Seatbelt Pretensioners', effect: { target: 'RepairCost', amount: -0.02 } },
    { name: 'Airbags', effect: { target: 'RepairCost', amount: -0.02 } },
    { name: 'ABS Braking', effect: { target: 'Reliability', amount: 0.02 } },
    { name: 'Crumple Zones', effect: { target: 'RepairCost', amount: -0.03 } },
    { name: 'Stability Control', effect: { target: 'Reliability', amount: 0.03 } },
  ],
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
        scienceCost: 20 + (index % 5) * 5,
        // Scaled for a $250,000 starting company, not the reference's late-game billion-dollar
        // save state - early nodes need to be affordable within the first month, not just the
        // first billion.
        moneyCost: 15_000 + (index % 6) * 12_000,
        breakthroughCostMultiplier: 1.6,
        durationDays: 4 + (index % 4),
        effects: [spec.effect],
      })

      previousId = id
      year += 2
      index += 1
    }
  }

  return nodes
}

/** 30 nodes (5 per category x 6 categories), chained within each category, spread 1968-2026 - same generation approach as ContentGeneratorWindow.GenerateResearchNodes(). */
export const RESEARCH_NODES: ResearchNodeDefinition[] = buildResearchNodes()
