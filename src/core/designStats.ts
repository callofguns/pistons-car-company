import type { ClassificationTagDefinition } from '../data/classifications'

/**
 * The six "meter" stats the design wizard's component screens build up (Safety, Handling,
 * Offroad, Comfort, Prestige, Attractiveness) - the web equivalent of the reference game's bottom
 * progress bars. Each is 0-100. Distinct from CarPerformanceStats (power/reliability/etc, which
 * come purely from the engine formula) - these come purely from chosen component options.
 */
export type DesignStatKey = 'safety' | 'handling' | 'offroad' | 'comfort' | 'prestige' | 'attractiveness'

export const DESIGN_STAT_KEYS: DesignStatKey[] = ['safety', 'handling', 'offroad', 'comfort', 'prestige', 'attractiveness']

export type DesignStats = Record<DesignStatKey, number>

export function createEmptyDesignStats(): DesignStats {
  return { safety: 0, handling: 0, offroad: 0, comfort: 0, prestige: 0, attractiveness: 0 }
}

const clampStat = (v: number) => Math.min(100, Math.max(0, v))

/** Sums every selected component option's stat effects into one 0-100-per-key totals object. */
export function computeDesignStats(effectsList: Partial<DesignStats>[]): DesignStats {
  const stats = createEmptyDesignStats()
  for (const effects of effectsList) {
    for (const key of DESIGN_STAT_KEYS) {
      const delta = effects[key]
      if (delta) stats[key] = clampStat(stats[key] + delta)
    }
  }
  return stats
}

/** 0-5 star rating (one decimal) for a single 0-100 stat, e.g. the Safety Rating result screen. */
export function starRating(statValue0to100: number): number {
  return Math.round((clampStat(statValue0to100) / 100) * 5 * 10) / 10
}

/**
 * How well the finished design's stats match its declared classification tags' target profile,
 * 0-100. A "Sport" tag that wants high handling but got a low-handling design scores low here.
 * This feeds a price adjustment in calculateCarSpecs - it deliberately does not touch market
 * simulation (matching demand/reputation to design fit is spec Section 5's job, not this pass's).
 */
export function designFitPercent(stats: DesignStats, tags: ClassificationTagDefinition[]): number {
  const targets = tags.flatMap((tag) => Object.entries(tag.statTargets) as [DesignStatKey, number][])
  if (targets.length === 0) return 100

  const totalDiff = targets.reduce((sum, [key, target]) => sum + Math.abs(stats[key] - target), 0)
  const avgDiff = totalDiff / targets.length
  return clampStat(100 - avgDiff)
}
