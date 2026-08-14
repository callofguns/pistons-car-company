import { describe, expect, it } from 'vitest'
import { advanceOneDay, createNewWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { addDays, makeDate } from '../src/core/gameDate'
import { recordTransaction } from '../src/core/ledger'

/**
 * Integration tests through the real advanceOneDay path (same function the store and market
 * simulation call), styled after tests/economicSystemIntegration.test.ts - but driving the
 * calendar with direct advanceOneDay(..., date) calls instead of tickWorld's real-time stepping,
 * for exact control over which day is "day 1" (the monthly-tick boundary the News hooks care
 * about) without depending on market-simulation randomness.
 */
describe('news events - integration through advanceOneDay', () => {
  it('MonthlyReport captures non-zero income and expense - pins the ordering requirement that it posts BEFORE onLedgerMonthTick clears the month buckets', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    const day1 = makeDate(1971, 3, 1)
    recordTransaction(world.ledger, 'Sales', 12_000, day1)

    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, day1)

    // If MonthlyReport were posted after onLedgerMonthTick instead, both of these would be 0 -
    // this is the exact bug the ordering comment in world.ts guards against.
    const report = world.news.entries.find((e) => e.type === 'MonthlyReport')
    expect(report).toBeDefined()
    expect(Number(report!.params.income)).toBe(12_000)
    expect(Number(report!.params.expense)).toBeGreaterThan(0) // HQ overhead alone guarantees this

    // The ledger's own live buckets are cleared for the new month, but the already-posted News
    // entry's snapshot is untouched - proving params holds plain numbers, not a live reference.
    expect(world.ledger.monthIncomeByCategory).toEqual({})
  })

  it('posts exactly one ResearchCompleted entry when a node finishes, not one per day while it stays researched', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    const node = CATALOG.researchNodes[0]
    world.research.nodeRuntime[node.id] = { started: true, isBreakthrough: false, progress01: 0.999999, researched: false }

    let day = makeDate(1971, 3, 15)
    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, day) // finishes this tick
    day = addDays(day, 1)
    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, day) // already researched - must not re-post

    const completions = world.news.entries.filter((e) => e.type === 'ResearchCompleted' && e.params.nodeId === node.id)
    expect(completions).toHaveLength(1)
  })

  it('stores the nodeId, not a resolved display name, in a ResearchCompleted entry', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    const node = CATALOG.researchNodes[0]
    world.research.nodeRuntime[node.id] = { started: true, isBreakthrough: false, progress01: 0.999999, researched: false }

    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, makeDate(1971, 3, 15))

    const entry = world.news.entries.find((e) => e.type === 'ResearchCompleted')
    expect(entry?.params.nodeId).toBe(node.id)
  })

  it('fires BankruptcyWarning exactly twice over a full insolvency episode - entering the red, and again near the grace-day deadline - with no per-day spam in between', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    world.bank.balance = DEFAULT_GAME_CONFIG.bankruptcyBalanceThreshold - 1

    let day = makeDate(1971, 3, 1)
    for (let i = 0; i < DEFAULT_GAME_CONFIG.bankruptcyGraceDays; i++) {
      advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, day)
      day = addDays(day, 1)
    }

    expect(world.company.isBankrupt).toBe(true)
    const warnings = world.news.entries.filter((e) => e.type === 'BankruptcyWarning')
    expect(warnings).toHaveLength(2)
  })

  it('does not fire BankruptcyWarning at all for a company that stays solvent', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, makeDate(1971, 3, 15))
    expect(world.news.entries.some((e) => e.type === 'BankruptcyWarning')).toBe(false)
  })
})
