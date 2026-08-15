import type { BodyStyleDefinition } from './vehicles'
import type { ResearchNodeDefinition, ResearchCategory } from './research'
import type { MarketSegmentDefinition } from './market'
import type { PromotionTierDefinition } from './marketing'
import type { RumorTemplateSet } from './company'
import type { RaceTierDefinition } from './racing'
import type { HQLevelDefinition } from './hq'
import type { EmployeePerkDefinition } from './staff'

/** All authored content in one place - the TS equivalent of DefinitionCatalog.cs, just a plain object instead of a ScriptableObject asset. Loaded once from src/data/, never mutated at runtime. */
export interface Catalog {
  bodies: BodyStyleDefinition[]
  researchNodes: ResearchNodeDefinition[]
  marketSegments: MarketSegmentDefinition[]
  promotionTiers: PromotionTierDefinition[]
  raceTiers: RaceTierDefinition[]
  rumorTemplates: RumorTemplateSet
  hqLevels: HQLevelDefinition[]
  employeePerks: EmployeePerkDefinition[]
  /** Applicant/employee name pool - see staff.ts's generateCandidate. Catalog-wired (rather than
   * imported directly into staff.ts) so staff.ts stays as fixture-testable as racing.ts. */
  employeeNames: string[]
}

export function findBody(catalog: Catalog, id: string): BodyStyleDefinition | undefined {
  return catalog.bodies.find((b) => b.id === id)
}

export function nodesInCategory(catalog: Catalog, category: ResearchCategory): ResearchNodeDefinition[] {
  return catalog.researchNodes.filter((n) => n.category === category)
}
