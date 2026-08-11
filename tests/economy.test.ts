import { describe, expect, it } from 'vitest'
import { canAfford, createBank, deposit, tryWithdraw } from '../src/core/economy'

describe('economy (Bank)', () => {
  it('rejects an overdraft and leaves the balance unchanged', () => {
    const bank = createBank(1000)
    const result = tryWithdraw(bank, 1500)
    expect(result).toBe(false)
    expect(bank.balance).toBe(1000)
  })

  it('succeeds and reduces the balance when affordable', () => {
    const bank = createBank(1000)
    const result = tryWithdraw(bank, 400)
    expect(result).toBe(true)
    expect(bank.balance).toBe(600)
  })

  it('deposits increase the balance', () => {
    const bank = createBank(250_000)
    deposit(bank, 50_000)
    expect(bank.balance).toBe(300_000)
  })

  it('canAfford matches a plain balance comparison', () => {
    const bank = createBank(1000)
    expect(canAfford(bank, 1000)).toBe(true)
    expect(canAfford(bank, 1000.01)).toBe(false)
  })
})
