import { describe, expect, it } from 'vitest'
import { currentHqLevel, nextHqLevel, hqSlotCap, hqMonthlyOverhead, upgradeHq, type HQLevelDefinition } from '../src/core/hq'
import { createCompanyState } from '../src/core/company'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { makeDate } from '../src/core/gameDate'

const LEVELS: HQLevelDefinition[] = [
  { level: 1, displayNameKey: 'data.hqLevel.1.name', slots: 3, monthlyOverhead: 15_000, upgradeCost: 0 },
  { level: 2, displayNameKey: 'data.hqLevel.2.name', slots: 6, monthlyOverhead: 45_000, upgradeCost: 300_000 },
  { level: 3, displayNameKey: 'data.hqLevel.3.name', slots: 10, monthlyOverhead: 150_000, upgradeCost: 1_500_000 },
]

describe('currentHqLevel / nextHqLevel', () => {
  it('resolves the matching level definition', () => {
    expect(currentHqLevel(LEVELS, 2)).toEqual(LEVELS[1])
  })

  it('falls back to the first level for an out-of-range value rather than crashing', () => {
    expect(currentHqLevel(LEVELS, 99)).toEqual(LEVELS[0])
  })

  it('nextHqLevel returns the following rung, or undefined at the top', () => {
    expect(nextHqLevel(LEVELS, 1)).toEqual(LEVELS[1])
    expect(nextHqLevel(LEVELS, 3)).toBeUndefined()
  })
})

describe('hqSlotCap / hqMonthlyOverhead', () => {
  it('read straight through to the current level definition', () => {
    expect(hqSlotCap(LEVELS, 2)).toBe(6)
    expect(hqMonthlyOverhead(LEVELS, 2)).toBe(45_000)
  })
})

describe('upgradeHq', () => {
  it('charges the next level\'s upgradeCost, records it to the ledger, and advances hqLevel', () => {
    const company = createCompanyState('Test Co', 'Testville', 100)
    const bank = createBank(1_000_000)
    const ledger = createLedgerState()

    const ok = upgradeHq(company, LEVELS, bank, ledger, makeDate(1980, 1, 1))

    expect(ok).toBe(true)
    expect(company.hqLevel).toBe(2)
    expect(bank.balance).toBe(1_000_000 - 300_000)
    expect(ledger.monthExpenseByCategory['HQUpgrade']).toBe(300_000)
  })

  it('fails and leaves state untouched when the cost is unaffordable', () => {
    const company = createCompanyState('Test Co', 'Testville', 100)
    const bank = createBank(1_000)
    const ledger = createLedgerState()

    const ok = upgradeHq(company, LEVELS, bank, ledger, makeDate(1980, 1, 1))

    expect(ok).toBe(false)
    expect(company.hqLevel).toBe(1)
    expect(bank.balance).toBe(1_000)
  })

  it('fails once already at the max level', () => {
    const company = createCompanyState('Test Co', 'Testville', 100)
    company.hqLevel = 3
    const bank = createBank(100_000_000)
    const ledger = createLedgerState()

    expect(upgradeHq(company, LEVELS, bank, ledger, makeDate(1980, 1, 1))).toBe(false)
    expect(company.hqLevel).toBe(3)
  })

  it('upgrades one level at a time, in sequence', () => {
    const company = createCompanyState('Test Co', 'Testville', 100)
    const bank = createBank(100_000_000)
    const ledger = createLedgerState()

    expect(upgradeHq(company, LEVELS, bank, ledger, makeDate(1980, 1, 1))).toBe(true)
    expect(company.hqLevel).toBe(2)
    expect(upgradeHq(company, LEVELS, bank, ledger, makeDate(1980, 1, 1))).toBe(true)
    expect(company.hqLevel).toBe(3)
  })
})
