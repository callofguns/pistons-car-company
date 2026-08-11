import { describe, expect, it } from 'vitest'
import { createNewWorld, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { setBudgetLevel } from '../src/core/staff'
import { takeLoan } from '../src/core/economy'

/**
 * End-to-end checks through the real World/tickWorld path (the same functions the store and UI
 * call, with real calendar advancement via addDays) at the real DEFAULT_GAME_CONFIG thresholds -
 * not just the isolated unit tests above. This is the scenario an interactive browser check would
 * otherwise cover.
 */
describe('economic system, end to end', () => {
  it('a company with no income and maxed-out staff spending eventually goes bankrupt', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    setBudgetLevel(world.staff, 1) // max headcount/expense, no models to sell means zero income

    let daysElapsed = 0
    while (!world.company.isBankrupt && daysElapsed < 120) {
      daysElapsed += tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
    }

    expect(world.company.isBankrupt).toBe(true)
    expect(daysElapsed).toBeGreaterThan(0)
    expect(daysElapsed).toBeLessThan(120)
    expect(world.bank.balance).toBeLessThan(DEFAULT_GAME_CONFIG.bankruptcyBalanceThreshold)
  })

  it('taking a loan keeps a cash-strapped company solvent through a full monthly payment cycle', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    setBudgetLevel(world.staff, 1)
    // Simulate a company already under pressure, not a fresh $250K start.
    world.bank.balance = 5_000

    takeLoan(world.bank, world.ledger, 400_000, 0.12, 24, world.time.currentDate)
    expect(world.bank.balance).toBeGreaterThan(400_000)

    for (let i = 0; i < 35; i++) tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)

    // 35 days crosses at least one month boundary, so the loan's first amortized payment must
    // have actually been deducted (proving onLoanMonthTick really runs from the daily tick path).
    expect(world.bank.loans[0].remainingBalance).toBeLessThan(400_000)
    expect(world.company.isBankrupt).toBe(false)
  })
})
