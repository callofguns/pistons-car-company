import { describe, expect, it } from 'vitest'
import {
  applyOverdraftInterest,
  checkBankruptcy,
  computeAmortizedPayment,
  createBank,
  onLoanMonthTick,
  payMandatory,
  takeLoan,
} from '../src/core/economy'
import { createLedgerState, monthTotalExpense, monthTotalIncome } from '../src/core/ledger'
import { createCompanyState } from '../src/core/company'
import { makeDate } from '../src/core/gameDate'

const TODAY = makeDate(1974, 1, 1)

describe('payMandatory', () => {
  it('can push the balance negative, unlike tryWithdraw', () => {
    const bank = createBank(1000)
    const ledger = createLedgerState()

    payMandatory(bank, ledger, 1500, 'Staff', TODAY)

    expect(bank.balance).toBe(-500)
    expect(monthTotalExpense(ledger)).toBe(1500)
  })
})

describe('takeLoan / onLoanMonthTick', () => {
  it('deposits the principal immediately and records it as income', () => {
    const bank = createBank(10_000)
    const ledger = createLedgerState()

    const loan = takeLoan(bank, ledger, 50_000, 0.08, 12, TODAY)

    expect(bank.balance).toBe(60_000)
    expect(bank.loans).toHaveLength(1)
    expect(loan.remainingBalance).toBe(50_000)
    expect(monthTotalIncome(ledger)).toBe(50_000)
  })

  it('computes a positive amortized payment that fully retires the loan over its term', () => {
    const payment = computeAmortizedPayment(50_000, 0.08, 12)
    expect(payment).toBeGreaterThan(50_000 / 12) // must exceed the interest-free installment
    expect(payment).toBeLessThan(50_000 / 12 + 1000) // but not by an absurd amount
  })

  it('monthly payments reduce the balance and eventually pay the loan off', () => {
    const bank = createBank(1_000_000)
    const ledger = createLedgerState()
    takeLoan(bank, ledger, 50_000, 0.08, 12, TODAY)

    for (let i = 0; i < 11; i++) onLoanMonthTick(bank, ledger, TODAY)
    expect(bank.loans).toHaveLength(1)
    expect(bank.loans[0].remainingBalance).toBeGreaterThan(0)

    onLoanMonthTick(bank, ledger, TODAY) // 12th and final payment
    expect(bank.loans).toHaveLength(0)
  })
})

describe('applyOverdraftInterest', () => {
  it('does nothing when the balance is non-negative', () => {
    const bank = createBank(1000)
    const ledger = createLedgerState()
    applyOverdraftInterest(bank, ledger, 0.003, TODAY)
    expect(bank.balance).toBe(1000)
  })

  it('compounds daily interest on a negative balance', () => {
    const bank = createBank(-1000)
    const ledger = createLedgerState()
    applyOverdraftInterest(bank, ledger, 0.01, TODAY)
    expect(bank.balance).toBeCloseTo(-1010, 5)
  })
})

describe('checkBankruptcy', () => {
  it('does not trigger while the balance stays above the threshold', () => {
    const bank = createBank(-1000)
    const company = createCompanyState('Test Co', 'Testville', 100_000)
    checkBankruptcy(bank, company, -150_000, 14)
    expect(company.isBankrupt).toBe(false)
    expect(company.daysInsolvent).toBe(0)
  })

  it('counts consecutive days below the threshold and triggers after the grace period', () => {
    const bank = createBank(-200_000)
    const company = createCompanyState('Test Co', 'Testville', 100_000)

    for (let day = 0; day < 13; day++) {
      checkBankruptcy(bank, company, -150_000, 14)
      expect(company.isBankrupt).toBe(false)
    }
    checkBankruptcy(bank, company, -150_000, 14) // 14th day
    expect(company.isBankrupt).toBe(true)
  })

  it('resets the counter if the balance recovers before the grace period ends', () => {
    const bank = createBank(-200_000)
    const company = createCompanyState('Test Co', 'Testville', 100_000)

    checkBankruptcy(bank, company, -150_000, 14)
    checkBankruptcy(bank, company, -150_000, 14)
    expect(company.daysInsolvent).toBe(2)

    bank.balance = 0
    checkBankruptcy(bank, company, -150_000, 14)
    expect(company.daysInsolvent).toBe(0)
    expect(company.isBankrupt).toBe(false)
  })
})
