import type { Catalog } from './catalog'
import { createCompanyState, createRumorState, postResearchRumor, postSaleRumor, type CompanyState, type RumorState } from './company'
import { applyOverdraftInterest, checkBankruptcy, createBank, onLoanMonthTick, payMandatory, type BankState } from './economy'
import type { GameConfig } from './gameConfig'
import { makeDate, type GameDate } from './gameDate'
import { createLedgerState, onLedgerMonthTick, type LedgerState } from './ledger'
import { onMarketDayTick, createCompetitorState, type CompetitorState } from './market'
import { onMarketingDayTick } from './marketing'
import { onProductionDayTick } from './production'
import { createRacingState, type RacingState } from './racing'
import { onResearchDayTick, createResearchState, type ResearchState } from './research'
import { createStaffState, onStaffDayTick, productionSpeedBonusPercent, type StaffState } from './staff'
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
  research: ResearchState
  staff: StaffState
  vehicles: VehicleState
  competitors: CompetitorState
  racing: RacingState
}

export function createNewWorld(config: GameConfig): World {
  const startDate = makeDate(config.startYear, config.startMonth, config.startDay)

  return {
    time: createTimeState(startDate, config.secondsPerDay),
    bank: createBank(config.startingCapital),
    ledger: createLedgerState(),
    company: createCompanyState(config.defaultCompanyName, config.defaultHomeCity, config.startingPopulation),
    rumors: createRumorState(),
    research: createResearchState(config.startingResearchPoints),
    staff: createStaffState(),
    vehicles: createVehicleState(),
    competitors: createCompetitorState(config.startingCompetitorDailyVolume),
    racing: createRacingState(),
  }
}

/** Fixed daily tick order: research unlocks feed design, staff sets capacity, production fills stock, marketing/market sell it, then the financial-risk checks (overdraft interest, bankruptcy) run last so they see the day's final balance. Mirrors SimulationRunner.cs's system order exactly, extended with the new financial-risk systems. */
export function advanceOneDay(world: World, catalog: Catalog, config: GameConfig, today: GameDate): void {
  onResearchDayTick(world.research, catalog.researchNodes, config.researchPointsPerDay)
  onStaffDayTick(world.staff, world.bank, world.ledger, today)
  payMandatory(world.bank, world.ledger, config.hqOverheadPerMonth / 30, 'HQOverhead', today)
  onProductionDayTick(world.vehicles.models, world.bank, world.ledger, today, productionSpeedBonusPercent(world.staff))
  onMarketingDayTick(world.vehicles.models)

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
    if (model.totalSold > soldBefore[i]) postSaleRumor(world.rumors, catalog.rumorTemplates, world.company, model)
  })

  if (today.day === 1) {
    onLoanMonthTick(world.bank, world.ledger, today)
    onLedgerMonthTick(world.ledger)
  }

  applyOverdraftInterest(world.bank, world.ledger, config.overdraftDailyInterestRate, today)
  checkBankruptcy(world.bank, world.company, config.bankruptcyBalanceThreshold, config.bankruptcyGraceDays)
}

/** Advances the world clock by deltaSeconds of real time, running advanceOneDay for every in-game day crossed. Returns how many days elapsed this call. */
export function tickWorld(world: World, catalog: Catalog, config: GameConfig, deltaSeconds: number): number {
  return tickTime(world.time, deltaSeconds, (today) => advanceOneDay(world, catalog, config, today))
}

/** Call after research state changes (e.g. a node just finished) to occasionally post a flavor rumor - kept separate from advanceOneDay since research completion can also happen off the daily tick in principle. */
export function notifyResearchProgressed(world: World, catalog: Catalog): void {
  postResearchRumor(world.rumors, catalog.rumorTemplates, world.company)
}
