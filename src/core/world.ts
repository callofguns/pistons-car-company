import type { Catalog } from './catalog'
import { freshness } from './aging'
import { averageScore, reviewDemandMultiplier, reviewModel, reviewReputationChange } from './reviews'
import { activeEvents, combineEvents, eventChangesToday, type EventEffects } from './events'
import { createCompanyState, createRumorState, postResearchRumor, postSaleRumor, type CompanyState, type RumorState } from './company'
import { applyOverdraftInterest, checkBankruptcy, createBank, onLoanMonthTick, payMandatory, type BankState } from './economy'
import type { GameConfig } from './gameConfig'
import { makeDate, type GameDate } from './gameDate'
import { createLedgerState, monthTotalExpense, monthTotalIncome, onLedgerMonthTick, type LedgerState } from './ledger'
import { onMarketDayTick, createCompetitorState, growReach, totalMarketCarsPerDay, type CompetitorState, type MarketConditions } from './market'
import { onMarketingDayTick } from './marketing'
import { activeRandomMultipliers, createRandomEventsState, onRandomEventsDayTick, type RandomEventsState } from './randomEvents'
import { checkAchievements, createAchievementsState, type AchievementsState } from './achievements'
import { createRivalsState, onRivalsDayTick, rivalStrength, type RivalsState } from './rivals'
import { createNewsState, postNews, type NewsState } from './news'
import { isInDevelopment, onDevelopmentDayTick } from './development'
import { autoAssignReleasedModel, carsOnOrder, createFactoryState, onFactoryDayTick, onFactoryMonthTick, type FactoryState } from './factory'
import { difficultySettings } from './difficulty'
import type { CarClass } from './vehicles'
import { createRacingState, onRacingMonthTick, type RacingState } from './racing'
import { onResearchDayTick, createResearchState, type ResearchState } from './research'
import {
  createStaffState,
  onStaffDayTick,
  onStaffMonthTick,
  productionSpeedBonusPercent,
  researchPointsBonus,
  unitCostReductionPercent,
  type StaffState,
} from './staff'
import { hqMonthlyOverhead } from './hq'
import type { Difficulty } from './difficulty'
import {
  hqCity,
  hqClassDemand,
  hqCostMultiplier,
  startingCapitalFor,
  startingResearchPointsFor,
  type FounderProfile,
} from './foundation'
import { createTimeState, tickTime, type TimeState } from './time'
import { resolveBody, createVehicleState, type VehicleState } from './vehicleService'

/**
 * The composition root - every piece of live game state in one object. The TS equivalent of
 * GameContext.cs, minus the class ceremony: this is deliberately just data, mutated in place by
 * the functions in this file and its sibling modules. The store layer (src/store/) is the only
 * thing that knows this is meant to be observed by React; World itself has zero framework
 * awareness, same as the C# Core assembly had zero UI awareness.
 */
export interface World {
  time: TimeState
  bank: BankState
  ledger: LedgerState
  company: CompanyState
  rumors: RumorState
  news: NewsState
  research: ResearchState
  staff: StaffState
  vehicles: VehicleState
  competitors: CompetitorState
  rivals: RivalsState
  achievements: AchievementsState
  randomEvents: RandomEventsState
  racing: RacingState
  factory: FactoryState
}

export function createNewWorld(
  config: GameConfig,
  catalog: Catalog,
  companyName?: string,
  difficulty: Difficulty = 'normal',
  founder?: FounderProfile,
): World {
  const startDate = makeDate(config.startYear, config.startMonth, config.startDay)

  return {
    time: createTimeState(startDate, config.secondsPerDay),
    bank: createBank(startingCapitalFor(config.startingCapital, founder)),
    ledger: createLedgerState(),
    company: createCompanyState(
      companyName ?? config.defaultCompanyName,
      hqCity(founder) ?? config.defaultHomeCity,
      config.startingPopulation,
      difficulty,
      founder,
    ),
    rumors: createRumorState(),
    news: createNewsState(),
    research: createResearchState(startingResearchPointsFor(config.startingResearchPoints, founder)),
    staff: createStaffState(catalog.employeeNames, catalog.employeePerks),
    vehicles: createVehicleState(),
    competitors: createCompetitorState(),
    rivals: createRivalsState(config.startYear),
    achievements: createAchievementsState(),
    randomEvents: createRandomEventsState(),
    racing: createRacingState(),
    factory: createFactoryState(),
  }
}

/** Today's market conditions: difficulty plus (later) history events and per-model factors. */
/** Today's history events, added up. */
export function eventEffectsFor(world: World, catalog: Catalog): EventEffects {
  const effects = combineEvents(activeEvents(catalog.historyEvents, world.time.currentDate))
  // Plus whatever the player's random-event decisions are still doing.
  const random = activeRandomMultipliers(world.randomEvents)
  effects.demandMultiplier *= random.demand
  effects.productionSpeedMultiplier *= random.speed
  effects.productionCostMultiplier *= random.cost
  return effects
}

function mergeClassDemand(
  a: Partial<Record<CarClass, number>>,
  b: Partial<Record<CarClass, number>>,
): Partial<Record<CarClass, number>> {
  const merged = { ...a }
  for (const [carClass, m] of Object.entries(b) as [CarClass, number][]) merged[carClass] = (merged[carClass] ?? 1) * m
  return merged
}

export function marketConditionsFor(world: World, events: EventEffects): MarketConditions {
  return {
    demandMultiplier: difficultySettings(world.company.difficulty).demandMultiplier * events.demandMultiplier,
    fuelEconomyWeightMultiplier: events.fuelEconomyWeightMultiplier,
    powerWeightMultiplier: events.powerWeightMultiplier,
    classDemandMultiplier: mergeClassDemand(events.classDemandMultiplier, hqClassDemand(world.company.founder)),
    rivalStrength: rivalStrength(world.rivals, world.time.currentDate.year),
    // Laws in force x how fresh the design still is.
    modelMultiplier: (model) => events.modelMultiplier(model) * freshness(model, world.time.currentDate) * reviewDemandMultiplier(model),
  }
}

/** Fixed daily tick order: research (points only while a car is in development) and development
 * countdowns first, then staff, the factory builds cars, marketing/market sell them, then the
 * financial-risk checks (overdraft interest, bankruptcy) run last so they see the day's final
 * balance. Monthly bills (wages, HQ overhead, line upkeep, storage, loans) land on day 1. */
export function advanceOneDay(world: World, catalog: Catalog, config: GameConfig, today: GameDate): void {
  const difficulty = difficultySettings(world.company.difficulty)
  const changes = eventChangesToday(catalog.historyEvents, today)
  for (const event of changes.started) postNews(world.news, 'HistoryEventStarted', today, { eventId: event.id })
  for (const event of changes.ended) postNews(world.news, 'HistoryEventEnded', today, { eventId: event.id })
  const events = eventEffectsFor(world, catalog)

  // Research points are earned only on days when at least one car is in development (Engineers
  // raise the rate) - researching itself keeps progressing either way.
  const developing = world.vehicles.models.some(isInDevelopment)
  const researchPointsToday = developing ? config.researchPointsPerDay + researchPointsBonus(world.staff, catalog.employeePerks) : 0
  const completedResearch = onResearchDayTick(world.research, catalog.researchNodes, researchPointsToday)
  for (const nodeId of completedResearch) postNews(world.news, 'ResearchCompleted', today, { nodeId })

  for (const model of onDevelopmentDayTick(world.vehicles.models)) {
    // A newly released model goes straight onto an idle line, if any - the player still decides
    // how many to build.
    autoAssignReleasedModel(world.factory, model.id)
    postNews(world.news, 'ModelReleased', today, { modelName: model.name, price: model.salePrice })

    // The motoring press tests every new car. Good reviews help sales and the company's name.
    model.reviews = reviewModel(model, today.year)
    world.company.reputationPercent = Math.min(100, Math.max(0, world.company.reputationPercent + reviewReputationChange(model.reviews)))
    const verdict = [...model.reviews].sort((a, b) => Math.abs(b.score - 5.5) - Math.abs(a.score - 5.5))[0]
    postNews(world.news, 'ModelReviewed', today, {
      modelName: model.name,
      score: averageScore(model.reviews),
      critic: verdict.critic,
      aspect: verdict.aspect,
      tone: verdict.tone,
    })
  }

  onStaffDayTick(world.staff, catalog.employeePerks)
  const built = onFactoryDayTick(world.factory, world.vehicles.models, world.bank, world.ledger, today, {
    speedMultiplier: (1 + productionSpeedBonusPercent(world.staff, catalog.employeePerks) / 100) * events.productionSpeedMultiplier,
    modelCostMultiplier: (model) => hqCostMultiplier(world.company.founder, { carClass: resolveBody(catalog.bodies, model)?.carClass, unitCost: model.unitCost, powerHp: model.stats.powerHp }),
    unitCostMultiplier: difficulty.costMultiplier * events.productionCostMultiplier * (1 - Math.min(90, unitCostReductionPercent(world.staff, catalog.employeePerks)) / 100),
  })
  for (const model of world.vehicles.models) if (built.has(model.id)) model.outOfStockNotified = false

  // Ad campaigns spread the word every day they run.
  for (const model of world.vehicles.models) {
    if (model.marketingActive) growReach(world.company, model.marketingReachPerDay ?? 0)
  }
  const endedCampaigns = onMarketingDayTick(world.vehicles.models)
  for (const model of endedCampaigns) postNews(world.news, 'MarketingCampaignEnded', today, { modelName: model.name })

  const soldBefore = world.vehicles.models.map((m) => m.totalSold)
  onMarketDayTick(
    world.vehicles.models,
    catalog.marketSegments,
    (model) => resolveBody(catalog.bodies, model),
    world.bank,
    world.ledger,
    today,
    world.company,
    world.competitors,
    marketConditionsFor(world, events),
  )

  // The rival makers sell whatever the player didn't, and now and then launch a new model.
  const playerSoldToday = world.vehicles.models.reduce((sum, m) => sum + m.lastDayUnitsSold, 0)
  const marketToday = totalMarketCarsPerDay(catalog.marketSegments, today.year)
  for (const launch of onRivalsDayTick(world.rivals, today.year, Math.max(marketToday, playerSoldToday), playerSoldToday)) {
    postNews(world.news, 'RivalLaunch', today, { rivalName: launch.rival.name, modelName: launch.modelName })
  }

  world.vehicles.models.forEach((model, i) => {
    if (model.totalSold > soldBefore[i]) {
      postSaleRumor(world.rumors, catalog.rumorTemplates, world.company, model)
      // Ran out today with nothing more on order: tell the player once per empty spell.
      if (model.inventory === 0 && carsOnOrder(world.factory, model.id) === 0 && !model.outOfStockNotified) {
        model.outOfStockNotified = true
        postNews(world.news, 'ModelSoldOut', today, { modelName: model.name })
      }
    }
  })

  onRandomEventsDayTick(world, today)
  checkAchievements(world, today)

  if (today.day === 1) {
    const loanIdsBefore = world.bank.loans.map((l) => ({ id: l.id, principal: l.principal }))
    onLoanMonthTick(world.bank, world.ledger, today)
    for (const loan of loanIdsBefore) {
      if (!world.bank.loans.some((l) => l.id === loan.id)) {
        postNews(world.news, 'LoanPaidOff', today, { principal: loan.principal })
      }
    }

    onStaffMonthTick(world.staff, catalog.employeeNames, catalog.employeePerks, world.bank, world.ledger, today, difficulty.costMultiplier)
    payMandatory(world.bank, world.ledger, hqMonthlyOverhead(catalog.hqLevels, world.company.hqLevel) * difficulty.costMultiplier, 'HQOverhead', today)
    onFactoryMonthTick(world.factory, world.vehicles.models, world.bank, world.ledger, today, difficulty.costMultiplier)

    // Before the MonthlyReport snapshot below, same reason as everything else in this block - a
    // race prize (or entry fee, though that's already deducted at enterRace time) should count in
    // the month it actually landed in.
    const raceResult = onRacingMonthTick(world.racing, world.vehicles.models, catalog.raceTiers, world.company, world.bank, world.ledger, today)
    if (raceResult) {
      postNews(world.news, 'RaceCompleted', today, {
        modelName: raceResult.modelName,
        tierId: raceResult.tierId,
        position: raceResult.position,
        fieldSize: raceResult.fieldSize,
        prize: raceResult.prize,
      })
    }

    // Must read the month's income/expense BEFORE onLedgerMonthTick, which clears
    // monthIncomeByCategory/monthExpenseByCategory for the new month - posting after would report
    // a report full of zeros.
    postNews(world.news, 'MonthlyReport', today, {
      income: monthTotalIncome(world.ledger),
      expense: monthTotalExpense(world.ledger),
    })
    onLedgerMonthTick(world.ledger)
  }

  applyOverdraftInterest(world.bank, world.ledger, config.overdraftDailyInterestRate * difficulty.interestMultiplier, today)

  const wasInsolvent = world.company.daysInsolvent
  checkBankruptcy(world.bank, world.company, config.bankruptcyBalanceThreshold, config.bankruptcyGraceDays)
  // Edge-triggers on exact daysInsolvent values rather than a separate "already warned" flag -
  // checkBankruptcy resets daysInsolvent to 0 the moment the balance recovers, so these values can
  // only be hit once per insolvency episode without any extra dedupe state.
  if (wasInsolvent === 0 && world.company.daysInsolvent === 1) {
    postNews(world.news, 'BankruptcyWarning', today, { daysRemaining: config.bankruptcyGraceDays - 1 })
  } else if (world.company.daysInsolvent === Math.max(1, config.bankruptcyGraceDays - 3)) {
    postNews(world.news, 'BankruptcyWarning', today, { daysRemaining: config.bankruptcyGraceDays - world.company.daysInsolvent })
  }
}

/** Advances the world clock by deltaSeconds of real time, running advanceOneDay for every in-game day crossed. Returns how many days elapsed this call. */
export function tickWorld(world: World, catalog: Catalog, config: GameConfig, deltaSeconds: number): number {
  return tickTime(world.time, deltaSeconds, (today) => advanceOneDay(world, catalog, config, today))
}

/** Call after research state changes (e.g. a node just finished) to occasionally post a flavor rumor - kept separate from advanceOneDay since research completion can also happen off the daily tick in principle. */
export function notifyResearchProgressed(world: World, catalog: Catalog): void {
  postResearchRumor(world.rumors, catalog.rumorTemplates, world.company)
}
