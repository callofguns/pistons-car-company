import { isInDevelopment } from './development'
import { depositRecorded, type BankState } from './economy'
import { createRng } from './prng'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import type { CompanyState } from './company'
import { fansFromSales } from './foundation'
import type { BodyStyleDefinition, CarClass, CarModel } from './vehicles'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const inverseLerp = (a: number, b: number, v: number) => clamp01((v - a) / (b - a))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** How many people who know your company it takes to reach half of every buyer. Awareness is
 * reach / (reach + this): 20K people (a brand-new company) is ~3% of buyers, 600K is 50%. */
const HALF_AWARENESS_REACH = 600_000
/** How many new people a single car sold brings into the company's reach, via word of mouth. */
const WORD_OF_MOUTH_REACH_PER_UNIT_SOLD = 15
/** Reach growth tapers off toward this ceiling - by then awareness is already ~93%. */
const POPULATION_CEILING = 5_000_000
/** The buyer market grows every year (more people, more cars per family). */
const MARKET_GROWTH_PER_YEAR = 0.02
const MARKET_BASE_YEAR = 1970
/** Appeal of the average rival car, and how many rival makers compete for each aware buyer - a car
 * as appealing as a rival wins 1 in (RIVAL_COUNT + 1) of them. See captureShare. */
const RIVAL_APPEAL = 0.6
const RIVAL_COUNT = 3
/** Rivals' combined pull (the sum of their appeal squared) when none are simulated. */
const DEFAULT_RIVAL_STRENGTH = RIVAL_COUNT * RIVAL_APPEAL * RIVAL_APPEAL

/** A buyer segment (Economy, Family, Luxury, Sports, Utility). Every on-sale model is scored
 * against each segment's preferences to decide daily demand. */
export interface MarketSegmentDefinition {
  id: string
  displayName: string
  preferredClass: CarClass
  weightPower: number
  weightReliability: number
  weightFuelEconomy: number
  weightPrice: number
  /** Unused since the market rework; kept so segment data stays a plain, complete table. */
  populationShare: number
  /** Price this segment expects to pay for a well-matched car; higher prices reduce appeal. */
  expectedPrice: number
  /** How many new cars this whole segment buys per day (from every maker) in 1970 - grows with
   * MARKET_GROWTH_PER_YEAR. */
  marketCarsPerDay: number
}

/** Everything outside a car's own design that shifts how well it sells today: difficulty, history
 * events (core/events.ts) and per-model factors such as age and regulations. Built fresh each day
 * by world.ts. */
export interface MarketConditions {
  /** Multiplies every model's demand (difficulty x recessions/booms). */
  demandMultiplier: number
  /** Multiplies how much buyers care about fuel economy (oil crises). */
  fuelEconomyWeightMultiplier: number
  /** Multiplies how much buyers care about power (cheap-fuel eras). */
  powerWeightMultiplier: number
  /** Extra demand for particular body classes (e.g. the SUV boom). */
  classDemandMultiplier: Partial<Record<CarClass, number>>
  /** How strongly the rival makers pull buyers away - see rivals.ts's rivalStrength. */
  rivalStrength: number
  /** Per-model multiplier - age (freshness), regulation bans. 1 = no effect, 0 = can't sell. */
  modelMultiplier: (model: CarModel) => number
}

export const NEUTRAL_MARKET_CONDITIONS: MarketConditions = {
  demandMultiplier: 1,
  fuelEconomyWeightMultiplier: 1,
  powerWeightMultiplier: 1,
  classDemandMultiplier: {},
  rivalStrength: DEFAULT_RIVAL_STRENGTH,
  modelMultiplier: () => 1,
}

/** Rival makers' day-to-day sales wobble, so market share isn't a perfectly smooth line. */
export interface CompetitorState {
  rngState: number
}

export function createCompetitorState(seed = 12345): CompetitorState {
  return { rngState: seed }
}

function nextWobble(competitors: CompetitorState): number {
  const rng = createRng(competitors.rngState)
  const wobble = 0.92 + rng() * 0.16 // +/-8%
  competitors.rngState = Math.floor(rng() * 2 ** 31)
  return wobble
}

export function marketGrowth(year: number): number {
  return 1 + Math.max(0, year - MARKET_BASE_YEAR) * MARKET_GROWTH_PER_YEAR
}

/** How many new cars every maker together sells per day in a year, before price and appeal. */
export function totalMarketCarsPerDay(segments: MarketSegmentDefinition[], year: number): number {
  return segments.reduce((sum, s) => sum + s.marketCarsPerDay, 0) * marketGrowth(year)
}

/** 0-1 share of the people in the market who have heard of the company. */
export function awareness(populationServed: number): number {
  return populationServed / (populationServed + HALF_AWARENESS_REACH)
}

/** Of the aware buyers in a segment, the fraction who pick this car over the rivals' - rising
 * steeply for a better-matched car. */
function captureShare(appeal: number, rivalStrength: number): number {
  const a = appeal * appeal
  return a / (a + rivalStrength)
}

/** How many of a segment's buyers can and will pay this price: a small bonus for undercutting
 * what they expect, falling off steeply above it - 25% over expected keeps ~54% of buyers,
 * double keeps ~8%. */
export function affordability(price: number, expectedPrice: number): number {
  const ratio = price / Math.max(1, expectedPrice)
  return ratio <= 1 ? 1 + (1 - ratio) * 0.3 : Math.exp(-4 * (ratio - 1))
}

/** Expected (fractional) cars per day this model would sell today with unlimited stock. */
export function dailyDemand(
  model: CarModel,
  body: BodyStyleDefinition | undefined,
  segments: MarketSegmentDefinition[],
  company: CompanyState,
  year: number,
  conditions: MarketConditions,
): number {
  const growth = marketGrowth(year)
  const aware = awareness(company.populationServed)
  let demand = 0
  for (const segment of segments) {
    const appeal = scoreAppeal(model, body, segment, conditions)
    const classBoost = body ? (conditions.classDemandMultiplier[body.carClass] ?? 1) : 1
    demand += segment.marketCarsPerDay * growth * classBoost * aware * captureShare(appeal, conditions.rivalStrength) * affordability(model.salePrice, segment.expectedPrice)
  }
  const reputationFactor = 0.5 + company.reputationPercent / 100
  return demand * reputationFactor * model.marketingEfficiencyMultiplier * conditions.demandMultiplier * conditions.modelMultiplier(model)
}

/**
 * The daily sell-through simulation. For every on-sale, released model with stock, works out the
 * day's demand (see dailyDemand), sells whole cars (carrying the fraction to tomorrow), deposits
 * the revenue, and nudges reputation, reach and market share.
 */
export function onMarketDayTick(
  models: CarModel[],
  segments: MarketSegmentDefinition[],
  resolveBody: (model: CarModel) => BodyStyleDefinition | undefined,
  bank: BankState,
  ledger: LedgerState,
  today: GameDate,
  company: CompanyState,
  competitors: CompetitorState,
  conditions: MarketConditions = NEUTRAL_MARKET_CONDITIONS,
): void {
  let reliabilityWeightedByVolume = 0
  let soldToday = 0

  for (const model of models) {
    if (!model.isOnSale || model.inventory <= 0 || isInDevelopment(model)) {
      model.currentDailySalesRatePercent = 0
      model.lastDayUnitsSold = 0
      model.lastDayRevenue = 0
      continue
    }

    const demand = dailyDemand(model, resolveBody(model), segments, company, today.year, conditions)

    // Whole cars only, with the leftover fraction carried to tomorrow (see CarModel.demandCarry).
    const totalDemand = demand + (model.demandCarry ?? 0)
    const wholeDemand = Math.floor(totalDemand)
    model.demandCarry = totalDemand - wholeDemand
    const unitsSold = Math.min(model.inventory, wholeDemand)
    model.currentDailySalesRatePercent = model.inventory <= 0 ? 0 : (100 * unitsSold) / model.inventory
    model.lastDayUnitsSold = unitsSold
    model.lastDayRevenue = 0

    if (unitsSold > 0) {
      const revenue = unitsSold * model.salePrice
      model.inventory -= unitsSold
      model.totalSold += unitsSold
      model.lifetimeEarnings += revenue
      model.lastDayRevenue = revenue
      reliabilityWeightedByVolume += model.stats.reliabilityPercent * unitsSold
      soldToday += unitsSold

      depositRecorded(bank, ledger, revenue, 'Sales', today)
      company.totalCarsSoldAllModels += unitsSold
      company.fans += fansFromSales(unitsSold, company.reputationPercent, company.founder)
      company.lifetimeEarnings += revenue
    }
  }

  // Market share: our cars against everything every maker sold today.
  const totalMarket = totalMarketCarsPerDay(segments, today.year) * nextWobble(competitors)
  const targetShare = totalMarket <= 0 ? 0 : (soldToday / (totalMarket + soldToday)) * 100
  company.marketSharePercent = lerp(company.marketSharePercent, targetShare, 0.05)

  // Reputation drifts slowly toward the reliability of whatever actually sold today - shipping
  // reliable cars builds it, shipping unreliable ones erodes it. No sales leaves it untouched.
  if (soldToday > 0) {
    company.reputationPercent = lerp(company.reputationPercent, reliabilityWeightedByVolume / soldToday, 0.02)
  }

  // Word of mouth: every car sold brings new people into the company's reach, tapering off near
  // POPULATION_CEILING.
  if (soldToday > 0) growReach(company, soldToday * WORD_OF_MOUTH_REACH_PER_UNIT_SOLD)
}

/** Adds people to the company's reach (word of mouth, ad campaigns), tapering near the ceiling. */
export function growReach(company: CompanyState, people: number): void {
  const headroom = clamp01(1 - company.populationServed / POPULATION_CEILING)
  company.populationServed += people * headroom
}

/** 0-1 fit score: how well a model's price/power/reliability/economy matches a segment's
 * preferences, with today's history events re-weighting what buyers care about. */
export function scoreAppeal(
  model: CarModel,
  body: BodyStyleDefinition | undefined,
  segment: MarketSegmentDefinition,
  conditions: MarketConditions = NEUTRAL_MARKET_CONDITIONS,
): number {
  const classMatch = body !== undefined && body.carClass === segment.preferredClass ? 1 : 0.35

  const priceScore = clamp01(1 - clamp01((model.salePrice - segment.expectedPrice) / Math.max(1, segment.expectedPrice)))

  const powerScore = inverseLerp(60, 400, model.stats.powerHp)
  const reliabilityScore = inverseLerp(25, 99, model.stats.reliabilityPercent)
  const economyScore = 1 - inverseLerp(4, 20, model.stats.fuelConsumptionL100Km)

  const weightPower = segment.weightPower * conditions.powerWeightMultiplier
  const weightFuel = segment.weightFuelEconomy * conditions.fuelEconomyWeightMultiplier

  const weighted =
    weightPower * powerScore +
    segment.weightReliability * reliabilityScore +
    weightFuel * economyScore +
    segment.weightPrice * priceScore

  const weightSum = Math.max(0.01, weightPower + segment.weightReliability + weightFuel + segment.weightPrice)
  return classMatch * clamp01(weighted / weightSum)
}
