import type { GameDate } from './gameDate'
import type { DesignStats } from './designStats'

/** The five body classes the player can design in, per the game brief. */
export type CarClass = 'Sedan' | 'SUV' | 'Sports' | 'Coupe' | 'Truck'

export type Aspiration = 'NaturallyAspirated' | 'Turbocharged' | 'Supercharged'

export type FuelType = 'Petrol' | 'Diesel' | 'Electric'

/** Designer-authored body style content - the TS equivalent of a BodyStyleDefinition ScriptableObject, now just a plain object literal in src/data/bodies.ts. */
export interface BodyStyleDefinition {
  id: string
  displayName: string
  carClass: CarClass
  /** Maximum engine displacement (litres) this body can accept. */
  engineBayCapacityLiters: number
  baseWeightKg: number
  /** One-time tooling/equipment cost charged when this body is first selected for a new design. */
  productionEquipmentCost: number
  /** Per-unit manufacturing cost contributed by the body shell alone (before engine/options). */
  baseUnitCost: number
  unlockYear: number
}

/** Player-tunable engine configuration for a design in progress. */
export interface EngineSpec {
  displacementLiters: number
  cylinders: number
  aspiration: Aspiration
  fuelType: FuelType
  valveCount: number
}

export const DEFAULT_ENGINE_SPEC: EngineSpec = {
  displacementLiters: 2.0,
  cylinders: 4,
  aspiration: 'NaturallyAspirated',
  fuelType: 'Petrol',
  valveCount: 8,
}

/** All derived numbers shown on the Model Lineup spec sheet. Pure output of calculateCarSpecs() - never hand-edited. */
export interface CarPerformanceStats {
  powerHp: number
  torqueNm: number
  torqueRpm: number
  fuelConsumptionL100Km: number
  reliabilityPercent: number
  emissionsGKm: number
  repairCost: number
  weightKg: number
  maxRpm: number
  zeroToHundredSec: number
  topSpeedKph: number
  /** 1-10, shown as "Rating 6" in the reference. */
  rating: number
  unitCost: number
  suggestedPrice: number
  /** The 6 component-driven meters (Safety/Handling/Offroad/Comfort/Prestige/Attractiveness), 0-100 each. */
  designStats: DesignStats
  /** How well designStats matches the design's classification tags, 0-100; scales suggestedPrice. */
  designFitPercent: number
}

/** A produced, sellable model in the player's lineup. Plain JSON-serializable data - no class instance, no engine object references (body is looked up by bodyStyleId when needed). */
export interface CarModel {
  id: string
  /** Player-authored free text (a pre-filled suggestion the player can edit before accepting) -
   * frozen at generation time and never retro-translated when the player later changes language,
   * same as company.companyName. See CarDesignScreen.tsx's generateDefaultName. */
  name: string
  bodyStyleId: string
  /** @deprecated Legacy display string (an uppercased, English-only join of the design's
   * classification tag labels), kept only so older saves round-trip and as a last-resort fallback.
   * Every display site should derive this from classificationTagIds via i18n/vehicles.ts's
   * formatCategoryTag() instead, which resolves through the current locale. */
  categoryTag: string
  engine: EngineSpec
  /** Which named preset in src/data/enginePresets.ts produced `engine`, if any (null if never set). */
  enginePresetId: string | null
  /** The 2 classification tag ids chosen in the design wizard (e.g. ['medium', 'sport']). */
  classificationTagIds: string[]
  /** Every component slot's chosen option id, keyed by slot id (e.g. 'body-material': 'aluminum'). */
  componentSelections: Record<string, string>
  stats: CarPerformanceStats
  issueDate: GameDate
  unitCost: number
  salePrice: number
  /** Total units this production run targets; can be raised later via extendProductionRun. Drives "Models left to sell" = plannedProductionRun - totalSold. */
  plannedProductionRun: number
  inventory: number
  totalProduced: number
  totalSold: number
  lifetimeEarnings: number
  /** False when the player has hit "Withdrawn from sale" on Sales Statistics. */
  isOnSale: boolean
  currentDailySalesRatePercent: number
  lastDayUnitsSold: number
  lastDayRevenue: number
  marketingActive: boolean
  marketingDaysRemaining: number
  marketingEfficiencyMultiplier: number
  /** True for exactly one model - whichever a company finalizes first. A brand-new company's
   * starting reach is deliberately tiny (see gameConfig.ts's startingPopulation), which leaves the
   * population-gated demand formula in market.ts with almost nothing to work with - without a
   * debut boost the very first car could sit unsold indefinitely and the company could never earn
   * the sales that grow its reach in the first place. See onMarketDayTick for how it tapers off. */
  isDebutModel: boolean
}

/** Transient wizard state for the Body Selection -> Car Design (Classification -> Safety -> Engine
 * -> ... -> Pricing) flow. Never saved - if the page reloads mid-design the player starts over. */
export interface ModelDesignSession {
  selectedBodyId: string | null
  engine: EngineSpec
  enginePresetId: string | null
  classificationTagIds: string[]
  /** Every component slot's chosen option id, keyed by slot id. Empty until vehicleService seeds
   * defaults (each slot's first option) once a body is selected - see selectBody. */
  componentSelections: Record<string, string>
  name: string
  categoryTag: string
  customPrice: number | null
  /** The model being restyled, if this session originated from "Create Restyling"; null for a from-scratch design. */
  sourceModelId: string | null
}

export function createDesignSession(): ModelDesignSession {
  return {
    selectedBodyId: null,
    engine: { ...DEFAULT_ENGINE_SPEC },
    enginePresetId: null,
    classificationTagIds: [],
    componentSelections: {},
    name: '',
    categoryTag: '',
    customPrice: null,
    sourceModelId: null,
  }
}
