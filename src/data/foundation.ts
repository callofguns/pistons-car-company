import type { CarClass } from '../core/vehicles'

/** The choices made when a new company is founded (the setup screens). Names and descriptions
 * live in en.ts as data.hq.<id>.*, data.goal.<id>.*, data.occupation.<id>.*. Ids are saved - never
 * rename them. */

export type FlagId = 'mexico' | 'brazil' | 'usa' | 'uk' | 'germany' | 'italy' | 'japan' | 'sweden'

export interface HqRegionDefinition {
  id: string
  flag: FlagId
  /** Becomes the company's home city. */
  city: string
  /** Cars of these classes cost this much less to build (0.5 = half price). */
  classCostMultiplier?: { classes: CarClass[]; multiplier: number }
  /** Every car costs this much of its normal price to build. */
  allCostMultiplier?: number
  /** Only the engine's share of the cost is reduced. */
  engineCostMultiplier?: number
  /** Buyers of these classes buy this much more (1.15 = 15% more). */
  classDemandMultiplier?: Partial<Record<CarClass, number>>
}

export const HQ_REGIONS: HqRegionDefinition[] = [
  { id: 'mexico', flag: 'mexico', city: 'Mexico City', allCostMultiplier: 0.9 },
  { id: 'brazil', flag: 'brazil', city: 'Brasilia', engineCostMultiplier: 0.92 },
  { id: 'usa', flag: 'usa', city: 'Washington', classCostMultiplier: { classes: ['SUV', 'Truck'], multiplier: 0.5 } },
  { id: 'uk', flag: 'uk', city: 'London', classDemandMultiplier: { Sports: 1.15, Coupe: 1.15 } },
  { id: 'germany', flag: 'germany', city: 'Munich', classDemandMultiplier: { Sedan: 1.12 } },
  { id: 'italy', flag: 'italy', city: 'Turin', classDemandMultiplier: { Sports: 1.2 } },
  { id: 'japan', flag: 'japan', city: 'Tokyo', allCostMultiplier: 0.95 },
  { id: 'sweden', flag: 'sweden', city: 'Stockholm', classDemandMultiplier: { SUV: 1.08, Sedan: 1.08 } },
]

export type GlobalGoalId = 'fans' | 'history' | 'wealth' | 'motorsport'

export interface GlobalGoalDefinition {
  id: GlobalGoalId
  /** The achievement (core/achievements.ts) that is "done" when this goal is reached. */
  achievementId: string
}

export const GLOBAL_GOALS: GlobalGoalDefinition[] = [
  { id: 'fans', achievementId: 'goal-fans' },
  { id: 'history', achievementId: 'goal-history' },
  { id: 'wealth', achievementId: 'goal-wealth' },
  { id: 'motorsport', achievementId: 'goal-motorsport' },
]

export type OccupationId = 'marketer' | 'publicFigure' | 'businessman' | 'innovator'

export interface OccupationDefinition {
  id: OccupationId
  marketingDiscountPercent?: number
  /** Extra fans from car sales, as a fraction (0.025 = +2.5%). */
  fanBonus?: number
  /** Extra starting cash, as a fraction (0.2 = +20%). */
  startingCapitalBonus?: number
  startingResearchPoints?: number
}

export const OCCUPATIONS: OccupationDefinition[] = [
  { id: 'marketer', marketingDiscountPercent: 10 },
  { id: 'publicFigure', fanBonus: 0.025 },
  { id: 'businessman', startingCapitalBonus: 0.2 },
  { id: 'innovator', startingResearchPoints: 50 },
]

/** Logo pieces. The symbol is a Lucide icon name (see components/CompanyLogo.tsx); the form is
 * the badge shape behind it. */
export const LOGO_SYMBOLS = [
  'Flame', 'Zap', 'Star', 'Crown', 'Rocket', 'Shield', 'Anchor', 'Compass', 'Mountain', 'Sun', 'Moon', 'Bird',
  'Cat', 'Dog', 'Fish', 'Gem', 'Leaf', 'Wind', 'Waves', 'Swords', 'Trophy', 'Flag', 'Cog', 'Gauge',
  'Atom', 'Rabbit', 'Squirrel', 'Snowflake', 'Skull', 'Target', 'Orbit', 'Infinity', 'Plane',
] as const

export const LOGO_FORM_COUNT = 8
export const LOGO_SYMBOL_COUNT = LOGO_SYMBOLS.length
