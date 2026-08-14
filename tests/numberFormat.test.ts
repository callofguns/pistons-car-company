import { describe, expect, it } from 'vitest'
import { compact, grouped, plainCurrency, signedPercent, splitMagnitude } from '../src/core/numberFormat'

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

  it('does not group a value under one thousand', () => {
    expect(grouped(999)).toBe('999')
  })

  it('space-groups every triad in a large value', () => {
    expect(grouped(1_234_567)).toBe('1 234 567')
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

// splitMagnitude is the shared threshold logic compact() and src/i18n/format.ts's locale-aware
// fmt.compact() both build on - pinned directly so the two renderers can't drift apart.
describe('splitMagnitude', () => {
  it('reports unit magnitude below one thousand', () => {
    expect(splitMagnitude(500)).toEqual({ sign: '', mantissa: 500, magnitude: 'unit' })
  })

  it('reports K magnitude at one thousand', () => {
    expect(splitMagnitude(1500)).toEqual({ sign: '', mantissa: 1.5, magnitude: 'K' })
  })

  it('reports B magnitude and preserves the sign for negative values', () => {
    expect(splitMagnitude(-2_000_000_000)).toEqual({ sign: '-', mantissa: 2, magnitude: 'B' })
  })
})
