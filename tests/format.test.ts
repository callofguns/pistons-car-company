import { describe, expect, it } from 'vitest'
import { formattersFor } from '../src/i18n/format'
import { makeDate } from '../src/core/gameDate'

describe('fmt.compact', () => {
  it('matches core compact() output in en', () => {
    expect(formattersFor('en').compact(1500)).toBe('1.5 K')
  })



  it('does not suffix a sub-thousand value', () => {
    expect(formattersFor('en').compact(500)).toBe('500')
  })

  it('preserves the sign for a negative value', () => {
    expect(formattersFor('en').compact(-2_000_000_000)).toBe('-2.0 B')
  })
})

describe('fmt.money', () => {
  it('prefixes compacted amounts with a dollar sign, sign first', () => {
    expect(formattersFor('en').money(250_000)).toBe('$250.0 K')
    expect(formattersFor('en').money(-1_500_000)).toBe('-$1.5 M')
    expect(formattersFor('en').money(500)).toBe('$500')
  })
})

describe('fmt.percent', () => {
  it('matches en output with a decimal point', () => {
    expect(formattersFor('en').percent(15.5)).toBe('15.5%')
  })

})

describe('fmt.date', () => {
  it('matches core formatDate() byte-for-byte in en', () => {
    expect(formattersFor('en').date(makeDate(1970, 1, 8))).toBe('8 Jan. 1970')
  })


})
