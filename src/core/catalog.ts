import type { BodyStyleDefinition } from './vehicles'
import type { ResearchNodeDefinition, ResearchCategory } from './research'
import type { MarketSegmentDefinition } from './market'
import type { PromotionTierDefinition } from './marketing'
import type { RumorTemplateSet } from './company'

/** All authored content in one place - the TS equivalent of DefinitionCatalog.cs, just a plain object instead of a ScriptableObject asset. Loaded once from src/data/, never mutated at runtime. */
export interface Catalog {
  bodies: BodyStyleDefinition[]
  researchNodes: ResearchNodeDefinition[]
  marketSegments: MarketSegmentDefinition[]
  promotionTiers: PromotionTierDefinition[]
  rumorTemplates: RumorTemplateSet
}

export function findBody(catalog: Catalog, id: string): BodyStyleDefinition | undefined {
  return catalog.bodies.find((b) => b.id === id)
}

export function nodesInCategory(catalog: Catalog, category: ResearchCategory): ResearchNodeDefinition[] {
  return catalog.researchNodes.filter((n) => n.category === category)
}
