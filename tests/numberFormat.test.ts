import { describe, expect, it } from 'vitest'
import { compact, grouped, plainCurrency, signedPercent } from '../src/core/numberFormat'

describe('numberFormat', () => {
  it('prints a plain integer below one thousand', () => {
    expect(compact(500)).toBe('500')
  })

  it('uses a K suffix for thousands', () => {
    expect(compact(1000)).toBe('1.0 K')
  })

  it('uses an M suffix for millions', () => {
    expect(compact(1_500_000)).toBe('1.5 M')
  })

  it('uses a B suffix for billions', () => {
    expect(compact(2_000_000_000)).toBe('2.0 B')
  })

  it('space-groups thousands with no suffix', () => {
    expect(grouped(97257)).toBe('97 257')
  })

  it('prefixes a dollar sign without grouping', () => {
    expect(plainCurrency(27902)).toBe('$27902')
  })

  it('gives positive deltas a plus sign', () => {
    expect(signedPercent(2)).toBe('+2%')
  })

  it('keeps the minus sign on negative deltas', () => {
    expect(signedPercent(-5)).toBe('-5%')
  })

  it('has no sign on zero', () => {
    expect(signedPercent(0)).toBe('0%')
  })
})
