/**
 * The single source of truth for cash. Plain mutable state + functions rather than a class with
 * events (port of Bank.cs) - the store bumps its revision counter after any world mutation, which
 * plays the role GameEvents.CashChanged played in the C# version.
 */
export interface BankState {
  balance: number
}

export function createBank(startingBalance: number): BankState {
  return { balance: startingBalance }
}

export function canAfford(bank: BankState, amount: number): boolean {
  return amount <= bank.balance
}

/** Returns false (and leaves the balance untouched) if the withdrawal can't be afforded. */
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
