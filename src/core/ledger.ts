/**
 * Categorized income/expense tracking - what makes "Profit = Units x (Price - Cost) - Overhead"
 * answerable on screen instead of just a formula. Every money movement in the game gets recorded
 * here via `recordTransaction`, keyed by category, so the Finance screen can show a real
 * month-to-date breakdown rather than just a single balance number.
 */
export type TransactionCategory =
  | 'Sales'
  | 'Staff'
  | 'HQOverhead'
  | 'HQUpgrade'
  | 'Production'
  | 'Research'
  | 'Marketing'
  | 'Racing'
  | 'LoanPrincipal'
  | 'LoanInterest'
  | 'OverdraftInterest'
  | 'Other'

export interface Transaction {
  category: TransactionCategory
  /** Positive for income, negative for expense. */
  amount: number
  year: number
  month: number
  day: number
}

export interface LedgerState {
  recentTransactions: Transaction[]
  monthIncomeByCategory: Partial<Record<TransactionCategory, number>>
  monthExpenseByCategory: Partial<Record<TransactionCategory, number>>
}

const MAX_HISTORY = 200

export function createLedgerState(): LedgerState {
  return { recentTransactions: [], monthIncomeByCategory: {}, monthExpenseByCategory: {} }
}

export function recordTransaction(
  ledger: LedgerState,
  category: TransactionCategory,
  amount: number,
  date: { year: number; month: number; day: number },
): void {
  if (amount === 0) return

  ledger.recentTransactions.unshift({ category, amount, year: date.year, month: date.month, day: date.day })
  if (ledger.recentTransactions.length > MAX_HISTORY) ledger.recentTransactions.length = MAX_HISTORY

  const bucket = amount > 0 ? ledger.monthIncomeByCategory : ledger.monthExpenseByCategory
  bucket[category] = (bucket[category] ?? 0) + Math.abs(amount)
}

export function monthTotalIncome(ledger: LedgerState): number {
  return Object.values(ledger.monthIncomeByCategory).reduce((sum, v) => sum + (v ?? 0), 0)
}

export function monthTotalExpense(ledger: LedgerState): number {
  return Object.values(ledger.monthExpenseByCategory).reduce((sum, v) => sum + (v ?? 0), 0)
}

export function monthNetProfit(ledger: LedgerState): number {
  return monthTotalIncome(ledger) - monthTotalExpense(ledger)
}

/** Call on month rollover (day === 1) to start a fresh month-to-date breakdown. */
export function onLedgerMonthTick(ledger: LedgerState): void {
  ledger.monthIncomeByCategory = {}
  ledger.monthExpenseByCategory = {}
}
