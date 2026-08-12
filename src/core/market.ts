import { depositRecorded, type BankState } from './economy'
import { createRng } from './prng'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import type { CompanyState } from './company'
import type { BodyStyleDefinition, CarClass, CarModel } from './vehicles'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const inverseLerp = (a: number, b: number, v: number) => clamp01((v - a) / (b - a))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Flat extra daily demand for a company's debut model, independent of population - the ordinary
 * formula multiplies demand by populationServed/500_000 per segment, which is deliberately near
 * nothing at the tiny starting population (see gameConfig.ts), so without this a first car could
 * sell nothing and a fresh company could never earn the sales that grow its reach. Represents
 * early curiosity about the new company that doesn't depend on reach it doesn't have yet. */
const DEBUT_BONUS_UNITS_PER_DAY = 8
/** The debut boost applies until the model has sold this many units total, then it's just another
 * model living on the (by then much larger) reach its own sales have built. */
const DEBUT_BONUS_SALES_CAP = 150

/** How many new people a single unit sold brings into the company's reach, via word of mouth -
 * this is the "something else" gameConfig.ts's startingPopulation comment predicted might one day
 * move populationServed off its deliberately tiny starting value. Tapers via POPULATION_CEILING so
 * a mature company doesn't grow forever - that ceiling sits comfortably above the point where every
 * market segment's own demand term is already saturated (scoreAppeal's /500_000 clamp), so nothing
 * downstream even notices reach beyond it. */
const WORD_OF_MOUTH_REACH_PER_UNIT_SOLD = 50
const POPULATION_CEILING = 5_000_000

/** A buyer segment (Economy, Family, Luxury, Sports, Utility). MarketSimulator scores every on-sale model against each segment's preferences to decide daily demand. */
export interface MarketSegmentDefinition {
  id: string
  displayName: string
  preferredClass: CarClass
  weightPower: number
  weightReliability: number
  weightFuelEconomy: number
  weightPrice: number
  /** Fraction of total market population belonging to this segment. */
  populationShare: number
  /** Price this segment expects to pay for a well-matched car; higher prices reduce appeal. */
  expectedPrice: number
  /** Base units/day a fully-matched, fully-marketed model could sell to this whole segment. */
  baseDemandPerDay: number
}

/** Simulated rival manufacturers, so market share is a share of *something* rather than always reading 100%. */
export interface CompetitorState {
  baselineVolume: number
  rngState: number
}

export function createCompetitorState(startingDailyVolume: number, seed = 12345): CompetitorState {
  return { baselineVolume: startingDailyVolume, rngState: seed }
}

export function getTodayCompetitorVolume(competitors: CompetitorState): number {
  const rng = createRng(competitors.rngState)
  competitors.baselineVolume *= 1.0002 // slow secular growth
  const wobble = 0.9 + rng() * 0.2 // +/-10%
  competitors.rngState = Math.floor(rng() * 2 ** 31)
  return competitors.baselineVolume * wobble
}

/**
 * The daily sell-through simulation. For every on-sale model with stock, scores it against every
 * market segment, converts the best-fit score into demand, sells min(demand, inventory), deposits
 * the revenue, and nudges reputation/market share. Never sells more units than a model has in
 * stock. Direct port of MarketSimulator.cs (including the reputation-drift mechanic).
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
): void {
  let ourVolumeToday = 0
  let reliabilityWeightedByVolume = 0
  let soldTodayAcrossAllModels = 0

  for (const model of models) {
    if (!model.isOnSale || model.inventory <= 0) {
      model.currentDailySalesRatePercent = 0
      model.lastDayUnitsSold = 0
      model.lastDayRevenue = 0
      continue
    }

    const body = resolveBody(model)
    let demand = 0

    for (const segment of segments) {
      const appeal = scoreAppeal(model, body, segment)
      const segmentPopulation = company.populationServed * segment.populationShare
      const reputationFactor = 0.5 + company.reputationPercent / 100
      demand +=
        segment.baseDemandPerDay *
        appeal *
        reputationFactor *
        model.marketingEfficiencyMultiplier *
        clamp01(segmentPopulation / 500_000)
    }

    if (model.isDebutModel && model.totalSold < DEBUT_BONUS_SALES_CAP) {
      demand += DEBUT_BONUS_UNITS_PER_DAY
    }

    const unitsSold = Math.min(model.inventory, Math.round(demand))
    model.currentDailySalesRatePercent = model.inventory <= 0 ? 0 : (100 * unitsSold) / model.inventory
    model.lastDayUnitsSold = unitsSold
    model.lastDayRevenue = 0

    if (unitsSold > 0) {
      const revenue = unitsSold * model.salePrice
      model.inventory -= unitsSold
      model.totalSold += unitsSold
      model.lifetimeEarnings += revenue
      model.lastDayRevenue = revenue
      ourVolumeToday += unitsSold
      reliabilityWeightedByVolume += model.stats.reliabilityPercent * unitsSold
      soldTodayAcrossAllModels += unitsSold

      depositRecorded(bank, ledger, revenue, 'Sales', today)
      company.totalCarsSoldAllModels += unitsSold
      company.lifetimeEarnings += revenue
    }
  }

  const competitorVolume = getTodayCompetitorVolume(competitors)
  const totalVolume = ourVolumeToday + competitorVolume
  const targetShare = totalVolume <= 0 ? company.marketSharePercent : (ourVolumeToday / totalVolume) * 100
  company.marketSharePercent = lerp(company.marketSharePercent, targetShare, 0.05)

  // Reputation drifts slowly toward the reliability of whatever actually sold today - shipping
  // reliable cars builds it, shipping unreliable ones erodes it. No sales today leaves it
  // untouched rather than decaying toward zero for lack of data.
  if (soldTodayAcrossAllModels > 0) {
    const targetReputation = reliabilityWeightedByVolume / soldTodayAcrossAllModels
    company.reputationPercent = lerp(company.reputationPercent, targetReputation, 0.02)
  }

  // Word of mouth: every unit actually sold brings new people into the company's reach, tapering
  // off as populationServed approaches POPULATION_CEILING. Selling nothing today grows nothing -
  // matches the deliberate choice to start a new company with almost no reach (gameConfig.ts).
  if (soldTodayAcrossAllModels > 0) {
    const headroom = clamp01(1 - company.populationServed / POPULATION_CEILING)
    company.populationServed += soldTodayAcrossAllModels * WORD_OF_MOUTH_REACH_PER_UNIT_SOLD * headroom
  }
}

/** 0-1 fit score: how well a model's price/power/reliability/economy matches a segment's preferences. */
function scoreAppeal(model: CarModel, body: BodyStyleDefinition | undefined, segment: MarketSegmentDefinition): number {
  const classMatch = body !== undefined && body.carClass === segment.preferredClass ? 1 : 0.35

  const priceScore = clamp01(1 - clamp01((model.salePrice - segment.expectedPrice) / Math.max(1, segment.expectedPrice)))

  const powerScore = inverseLerp(60, 400, model.stats.powerHp)
  const reliabilityScore = inverseLerp(25, 99, model.stats.reliabilityPercent)
  const economyScore = 1 - inverseLerp(4, 20, model.stats.fuelConsumptionL100Km)

  const weighted =
    segment.weightPower * powerScore +
    segment.weightReliability * reliabilityScore +
    segment.weightFuelEconomy * economyScore +
    segment.weightPrice * priceScore

  const weightSum = Math.max(
    0.01,
    segment.weightPower + segment.weightReliability + segment.weightFuelEconomy + segment.weightPrice,
  )
  return classMatch * clamp01(weighted / weightSum)
}
