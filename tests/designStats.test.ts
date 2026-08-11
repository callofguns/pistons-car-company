import { describe, expect, it } from 'vitest'
import { computeDesignStats, createEmptyDesignStats, designFitPercent, starRating } from '../src/core/designStats'
import type { ClassificationTagDefinition } from '../src/data/classifications'

describe('computeDesignStats', () => {
  it('sums option effects into their respective stats', () => {
    const stats = computeDesignStats([{ safety: 20 }, { safety: 15, handling: 10 }])
    expect(stats.safety).toBe(35)
    expect(stats.handling).toBe(10)
    expect(stats.comfort).toBe(0)
  })

  it('clamps at 100 even if effects would sum higher', () => {
    const stats = computeDesignStats([{ safety: 70 }, { safety: 70 }])
    expect(stats.safety).toBe(100)
  })

  it('never goes negative', () => {
    const stats = computeDesignStats([{ handling: -5 }])
    expect(stats.handling).toBe(0)
  })

  it('returns all-zero stats for no options', () => {
    expect(computeDesignStats([])).toEqual(createEmptyDesignStats())
  })
})

describe('starRating', () => {
  it('maps 0-100 to 0-5 stars', () => {
    expect(starRating(0)).toBe(0)
    expect(starRating(100)).toBe(5)
    expect(starRating(50)).toBe(2.5)
  })

  it('rounds to one decimal', () => {
    expect(starRating(33)).toBe(1.7) // 33/100 * 5 = 1.65 -> rounds to 1.7
  })
})

describe('designFitPercent', () => {
  const sportTag: ClassificationTagDefinition = {
    id: 'sport',
    label: 'Sport',
    category: 'type',
    description: '',
    priceMultiplier: 1.6,
    statTargets: { handling: 80, safety: 40 },
  }

  it('is 100 when there are no tags to match against', () => {
    expect(designFitPercent(createEmptyDesignStats(), [])).toBe(100)
  })

  it('scores 100 for a design that exactly matches its tags', () => {
    const stats = { ...createEmptyDesignStats(), handling: 80, safety: 40 }
    expect(designFitPercent(stats, [sportTag])).toBe(100)
  })

  it('scores lower the further the design strays from its tags', () => {
    const close = { ...createEmptyDesignStats(), handling: 75, safety: 40 }
    const far = { ...createEmptyDesignStats(), handling: 10, safety: 5 }
    expect(designFitPercent(close, [sportTag])).toBeGreaterThan(designFitPercent(far, [sportTag]))
  })
})
