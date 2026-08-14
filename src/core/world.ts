import type { Catalog } from './catalog'
import { createCompanyState, createRumorState, postResearchRumor, postSaleRumor, type CompanyState, type RumorState } from './company'
import { applyOverdraftInterest, checkBankruptcy, createBank, onLoanMonthTick, payMandatory, type BankState } from './economy'
import type { GameConfig } from './gameConfig'
import { makeDate, type GameDate } from './gameDate'
import { createLedgerState, monthTotalExpense, monthTotalIncome, onLedgerMonthTick, type LedgerState } from './ledger'
import { onMarketDayTick, createCompetitorState, type CompetitorState } from './market'
import { onMarketingDayTick } from './marketing'
import { createNewsState, postNews, type NewsState } from './news'
import { onProductionDayTick } from './production'
import { createRacingState, type RacingState } from './racing'
import { onResearchDayTick, createResearchState, type ResearchState } from './research'
import { createStaffState, onStaffDayTick, onStaffMonthTick, productionSpeedBonusPercent, type StaffState } from './staff'
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
  racing: RacingState
}

export function createNewWorld(config: GameConfig, companyName?: string): World {
  const startDate = makeDate(config.startYear, config.startMonth, config.startDay)

  return {
    time: createTimeState(startDate, config.secondsPerDay),
    bank: createBank(config.startingCapital),
    ledger: createLedgerState(),
    company: createCompanyState(companyName ?? config.defaultCompanyName, config.defaultHomeCity, config.startingPopulation),
    rumors: createRumorState(),
    news: createNewsState(),
    research: createResearchState(config.startingResearchPoints),
    staff: createStaffState(),
    vehicles: createVehicleState(),
    competitors: createCompetitorState(config.startingCompetitorDailyVolume),
    racing: createRacingState(),
  }
}

/** Fixed daily tick order: research unlocks feed design, staff sets capacity, production fills stock, marketing/market sell it, then the financial-risk checks (overdraft interest, bankruptcy) run last so they see the day's final balance. Mirrors SimulationRunner.cs's system order exactly, extended with the new financial-risk systems. HQ overhead and staff wages are billed once a month (see the day===1 block below), not prorated daily. */
export function advanceOneDay(world: World, catalog: Catalog, config: GameConfig, today: GameDate): void {
  const completedResearch = onResearchDayTick(world.research, catalog.researchNodes, config.researchPointsPerDay)
  for (const nodeId of completedResearch) postNews(world.news, 'ResearchCompleted', today, { nodeId })

  onStaffDayTick(world.staff)
  onProductionDayTick(world.vehicles.models, world.bank, world.ledger, today, productionSpeedBonusPercent(world.staff))

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
  )

  world.vehicles.models.forEach((model, i) => {
    if (model.totalSold > soldBefore[i]) {
      postSaleRumor(world.rumors, catalog.rumorTemplates, world.company, model)
      // Free to check here (already iterating with before/after totals in hand) rather than a
      // second pass - only fires once, the tick totalSold crosses plannedProductionRun, since
      // soldBefore[i] < plannedProductionRun is only true the one time that happens.
      if (model.totalSold >= model.plannedProductionRun && soldBefore[i] < model.plannedProductionRun) {
        postNews(world.news, 'ModelSoldOut', today, { modelName: model.name })
      }
    }
  })

  if (today.day === 1) {
    const loanIdsBefore = world.bank.loans.map((l) => ({ id: l.id, principal: l.principal }))
    onLoanMonthTick(world.bank, world.ledger, today)
    for (const loan of loanIdsBefore) {
      if (!world.bank.loans.some((l) => l.id === loan.id)) {
        postNews(world.news, 'LoanPaidOff', today, { principal: loan.principal })
      }
    }

    onStaffMonthTick(world.staff, world.bank, world.ledger, today)
    payMandatory(world.bank, world.ledger, config.hqOverheadPerMonth, 'HQOverhead', today)

    // Must read the month's income/expense BEFORE onLedgerMonthTick, which clears
    // monthIncomeByCategory/monthExpenseByCategory for the new month - posting after would report
    // a report full of zeros.
    postNews(world.news, 'MonthlyReport', today, {
      income: monthTotalIncome(world.ledger),
      expense: monthTotalExpense(world.ledger),
    })
    onLedgerMonthTick(world.ledger)
  }

  applyOverdraftInterest(world.bank, world.ledger, config.overdraftDailyInterestRate, today)

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
