import { describe, expect, it } from 'vitest'
import { freshness, releaseDate } from '../src/core/aging'
import { makeDate } from '../src/core/gameDate'
import type { CarModel } from '../src/core/vehicles'

const model = { issueDate: makeDate(1970, 1, 1), developmentDaysTotal: 31 } as unknown as CarModel

describe('car aging', () => {
  it('counts age from release, not from design', () => {
    expect(releaseDate(model)).toEqual(makeDate(1970, 2, 1))
  })

  it('a car is fully fresh for two years, then fades to a floor', () => {
    expect(freshness(model, makeDate(1972, 1, 1))).toBe(1)
    const fiveYears = freshness(model, makeDate(1975, 2, 1))
    expect(fiveYears).toBeLessThan(0.75)
    expect(fiveYears).toBeGreaterThan(0.6)
    expect(freshness(model, makeDate(1990, 1, 1))).toBe(0.3)
  })
})
