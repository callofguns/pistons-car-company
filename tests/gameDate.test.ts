import { describe, expect, it } from 'vitest'
import { addDays, compareDates, daysBetween, makeDate, monthAbbreviation } from '../src/core/gameDate'

describe('gameDate', () => {
  it('rolls over the month', () => {
    const date = addDays(makeDate(2024, 1, 31), 1)
    expect(date).toEqual({ year: 2024, month: 2, day: 1 })
  })

  it('rolls over the year', () => {
    const date = addDays(makeDate(2024, 12, 31), 1)
    expect(date).toEqual({ year: 2025, month: 1, day: 1 })
  })

  it('handles a leap year correctly', () => {
    // 2024 is a leap year - Feb 28 + 1 day = Feb 29, not Mar 1.
    const date = addDays(makeDate(2024, 2, 28), 1)
    expect(date).toEqual({ year: 2024, month: 2, day: 29 })
  })

  it('skips Feb 29 on a non-leap year', () => {
    const date = addDays(makeDate(2023, 2, 28), 1)
    expect(date).toEqual({ year: 2023, month: 3, day: 1 })
  })

  it('formats month abbreviations matching the reference ("Sep.")', () => {
    expect(monthAbbreviation(makeDate(1974, 9, 1))).toBe('Sep.')
    expect(monthAbbreviation(makeDate(1974, 5, 1))).toBe('May')
  })

  it('compares and diffs dates correctly', () => {
    const earlier = makeDate(1974, 9, 1)
    const later = makeDate(1974, 9, 2)
    expect(compareDates(earlier, later)).toBeLessThan(0)
    expect(daysBetween(earlier, later)).toBe(1)
  })
})
