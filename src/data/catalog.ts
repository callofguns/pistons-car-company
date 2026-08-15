import type { Catalog } from '../core/catalog'
import { BODIES } from './bodies'
import { RESEARCH_NODES } from './researchNodes'
import { MARKET_SEGMENTS } from './marketSegments'
import { PROMOTION_TIERS } from './promotionTiers'
import { RACE_TIERS } from './raceTiers'
import { RUMOR_TEMPLATES } from './rumorTemplates'

/** All authored content, assembled. Loaded once at app startup. */
export const CATALOG: Catalog = {
  bodies: BODIES,
  researchNodes: RESEARCH_NODES,
  marketSegments: MARKET_SEGMENTS,
  promotionTiers: PROMOTION_TIERS,
  raceTiers: RACE_TIERS,
  rumorTemplates: RUMOR_TEMPLATES,
}
