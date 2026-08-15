import type { HQLevelDefinition } from '../core/hq'

/** The five-rung HQ ladder. Level 1 deliberately keeps today's flat 15,000/month overhead value
 * (tests/newsEvents.test.ts's "HQ overhead alone guarantees expense > 0" assertion pins this), so
 * a brand-new company's finances feel identical to before this system existed. Costs/overhead
 * scale up alongside the rest of the game's money curve - RACING_REGISTRATION_COST is $40M and
 * the top race tier's entry fee is $5M (core/racing.ts, data/raceTiers.ts), so Global HQ's $30M
 * price tag is a serious, late-game-only investment, not a rounding error. */
export const HQ_LEVELS: HQLevelDefinition[] = [
  { level: 1, displayNameKey: 'data.hqLevel.1.name', slots: 3, monthlyOverhead: 15_000, upgradeCost: 0 },
  { level: 2, displayNameKey: 'data.hqLevel.2.name', slots: 6, monthlyOverhead: 45_000, upgradeCost: 300_000 },
  { level: 3, displayNameKey: 'data.hqLevel.3.name', slots: 10, monthlyOverhead: 150_000, upgradeCost: 1_500_000 },
  { level: 4, displayNameKey: 'data.hqLevel.4.name', slots: 15, monthlyOverhead: 500_000, upgradeCost: 7_000_000 },
  { level: 5, displayNameKey: 'data.hqLevel.5.name', slots: 22, monthlyOverhead: 1_500_000, upgradeCost: 30_000_000 },
]

export function findHqLevel(level: number): HQLevelDefinition | undefined {
  return HQ_LEVELS.find((l) => l.level === level)
}
