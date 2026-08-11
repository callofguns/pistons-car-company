import { recordTransaction, type LedgerState, type TransactionCategory } from './ledger'
import type { CompanyState } from './company'

type SimpleDate = { year: number; month: number; day: number }

/**
 * The single source of truth for cash, plus any outstanding loans. Plain mutable state +
 * functions rather than a class with events (port of Bank.cs, extended for real financial risk) -
 * the store bumps its revision counter after any world mutation, which plays the role
 * GameEvents.CashChanged played in the C# version.
 */
export interface BankState {
  balance: number
  loans: LoanState[]
}

export interface LoanState {
  id: string
  principal: number
  remainingBalance: number
  annualInterestRate: number
  termMonths: number
  monthlyPayment: number
}

export function createBank(startingBalance: number): BankState {
  return { balance: startingBalance, loans: [] }
}

export function canAfford(bank: BankState, amount: number): boolean {
  return amount <= bank.balance
}

/** Returns false (and leaves the balance untouched) if the withdrawal can't be afforded. Used for every *discretionary* spend - tooling, research, marketing, production, racing - which correctly just doesn't happen when cash is short. */
export function tryWithdraw(bank: BankState, amount: number): boolean {
  if (amount < 0) throw new RangeError('amount must be >= 0')
  if (!canAfford(bank, amount)) return false
  bank.balance -= amount
  return true
}

export function deposit(bank: BankState, amount: number): void {
  if (amount < 0) throw new RangeError('amount must be >= 0')
  if (amount === 0) return
  bank.balance += amount
}

/** Same as tryWithdraw, but also records a categorized ledger transaction on success. */
export function tryWithdrawRecorded(
  bank: BankState,
  ledger: LedgerState,
  amount: number,
  category: TransactionCategory,
  date: SimpleDate,
): boolean {
  if (!tryWithdraw(bank, amount)) return false
  recordTransaction(ledger, category, -amount, date)
  return true
}

export function depositRecorded(
  bank: BankState,
  ledger: LedgerState,
  amount: number,
  category: TransactionCategory,
  date: SimpleDate,
): void {
  if (amount <= 0) return
  deposit(bank, amount)
  recordTransaction(ledger, category, amount, date)
}

/**
 * Unconditionally deducts, even if it pushes the balance negative - this is the *only* way debt
 * can occur. Reserved for obligations a company can't just skip (staff wages, HQ overhead, loan
 * installments), never for discretionary spending.
 */
export function payMandatory(
  bank: BankState,
  ledger: LedgerState,
  amount: number,
  category: TransactionCategory,
  date: SimpleDate,
): void {
  if (amount <= 0) return
  bank.balance -= amount
  recordTransaction(ledger, category, -amount, date)
}

/** Standard loan amortization: fixed payment that pays off `principal` + interest over `termMonths`. */
export function computeAmortizedPayment(principal: number, annualInterestRate: number, termMonths: number): number {
  const monthlyRate = annualInterestRate / 12
  if (monthlyRate === 0) return principal / termMonths
  const factor = (1 + monthlyRate) ** termMonths
  return (principal * monthlyRate * factor) / (factor - 1)
}

let loanIdCounter = 0

/** Deposits the principal immediately and schedules amortized monthly repayments. */
export function takeLoan(
  bank: BankState,
  ledger: LedgerState,
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  date: SimpleDate,
): LoanState {
  loanIdCounter += 1
  const loan: LoanState = {
    id: `loan-${Date.now().toString(36)}-${loanIdCounter}`,
    principal,
    remainingBalance: principal,
    annualInterestRate,
    termMonths,
    monthlyPayment: computeAmortizedPayment(principal, annualInterestRate, termMonths),
  }
  bank.loans.push(loan)
  depositRecorded(bank, ledger, principal, 'LoanPrincipal', date)
  return loan
}

/** Call on month rollover: deducts each active loan's amortized payment (interest + principal portions recorded separately), removing loans once paid off. */
export function onLoanMonthTick(bank: BankState, ledger: LedgerState, date: SimpleDate): void {
  const stillActive: LoanState[] = []

  for (const loan of bank.loans) {
    const interestPortion = loan.remainingBalance * (loan.annualInterestRate / 12)
    const principalPortion = Math.min(loan.monthlyPayment - interestPortion, loan.remainingBalance)

    payMandatory(bank, ledger, interestPortion, 'LoanInterest', date)
    payMandatory(bank, ledger, principalPortion, 'LoanPrincipal', date)
    loan.remainingBalance -= principalPortion

    if (loan.remainingBalance > 0.01) stillActive.push(loan)
  }

  bank.loans = stillActive
}

/** Call once per day: a negative balance accrues daily interest, compounding - what makes running in the red actively dangerous rather than just inconvenient. */
export function applyOverdraftInterest(bank: BankState, ledger: LedgerState, dailyRate: number, date: SimpleDate): void {
  if (bank.balance >= 0) return
  const interest = -bank.balance * dailyRate
  payMandatory(bank, ledger, interest, 'OverdraftInterest', date)
}

/** Call once per day: tracks consecutive days below the insolvency threshold, triggering bankruptcy (a soft-fail state, not a crash) once the grace period runs out. Recovers/resets the moment the balance climbs back above the threshold. */
export function checkBankruptcy(
  bank: BankState,
  company: CompanyState,
  thresholdBalance: number,
  graceDays: number,
): void {
  if (bank.balance < thresholdBalance) {
    company.daysInsolvent += 1
    if (company.daysInsolvent >= graceDays) company.isBankrupt = true
  } else {
    company.daysInsolvent = 0
  }
}
