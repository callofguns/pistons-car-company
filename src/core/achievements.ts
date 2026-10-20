import { isInDevelopment } from './development'
import { depositRecorded } from './economy'
import { postNews } from './news'
import type { GameDate } from './gameDate'
import type { World } from './world'

export type AchievementGroup = 'Sales' | 'Money' | 'Market' | 'Company' | 'Research' | 'Survival'

/** What an achievement counts - decides the description text and how the target is shown. */
export type AchievementKind =
  | 'sold'
  | 'cash'
  | 'share'
  | 'reach'
  | 'reputation'
  | 'models'
  | 'researched'
  | 'lines'
  | 'lineLevel'
  | 'hq'
  | 'staff'
  | 'year'
  | 'rank'

export interface AchievementDefinition {
  id: string
  group: AchievementGroup
  kind: AchievementKind
  /** The measured value that completes it. */
  target: number
  /** Cash paid out when it is unlocked. */
  reward: number
}

/** Achievements unlocked so far, with the date. Saved with the game. */
export interface AchievementsState {
  unlocked: Record<string, GameDate>
}

export function createAchievementsState(): AchievementsState {
  return { unlocked: {} }
}

const M = 1_000_000

/** Everything the player can earn, in display order. Names and descriptions live in en.ts as
 * data.achievement.<id>.name; descriptions come from the kind. Ids are saved - never rename. */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'sold-100', group: 'Sales', kind: 'sold', target: 100, reward: 0.25 * M },
  { id: 'sold-1k', group: 'Sales', kind: 'sold', target: 1_000, reward: 0.5 * M },
  { id: 'sold-10k', group: 'Sales', kind: 'sold', target: 10_000, reward: 1 * M },
  { id: 'sold-100k', group: 'Sales', kind: 'sold', target: 100_000, reward: 3 * M },
  { id: 'sold-1m', group: 'Sales', kind: 'sold', target: 1_000_000, reward: 10 * M },
  { id: 'cash-100m', group: 'Money', kind: 'cash', target: 100 * M, reward: 1 * M },
  { id: 'cash-500m', group: 'Money', kind: 'cash', target: 500 * M, reward: 3 * M },
  { id: 'cash-1b', group: 'Money', kind: 'cash', target: 1_000 * M, reward: 10 * M },
  { id: 'cash-5b', group: 'Money', kind: 'cash', target: 5_000 * M, reward: 25 * M },
  { id: 'share-5', group: 'Market', kind: 'share', target: 5, reward: 0.5 * M },
  { id: 'share-15', group: 'Market', kind: 'share', target: 15, reward: 2 * M },
  { id: 'share-25', group: 'Market', kind: 'share', target: 25, reward: 5 * M },
  { id: 'number-one', group: 'Market', kind: 'rank', target: 1, reward: 5 * M },
  { id: 'reach-1m', group: 'Market', kind: 'reach', target: 1_000_000, reward: 1 * M },
  { id: 'reach-3m', group: 'Market', kind: 'reach', target: 3_000_000, reward: 3 * M },
  { id: 'rep-70', group: 'Market', kind: 'reputation', target: 70, reward: 0.5 * M },
  { id: 'rep-90', group: 'Market', kind: 'reputation', target: 90, reward: 2 * M },
  { id: 'first-car', group: 'Company', kind: 'models', target: 1, reward: 0.25 * M },
  { id: 'models-3', group: 'Company', kind: 'models', target: 3, reward: 0.5 * M },
  { id: 'models-8', group: 'Company', kind: 'models', target: 8, reward: 2 * M },
  { id: 'second-line', group: 'Company', kind: 'lines', target: 2, reward: 0.5 * M },
  { id: 'lines-5', group: 'Company', kind: 'lines', target: 5, reward: 3 * M },
  { id: 'fast-line', group: 'Company', kind: 'lineLevel', target: 5, reward: 2 * M },
  { id: 'hq-3', group: 'Company', kind: 'hq', target: 3, reward: 1 * M },
  { id: 'hq-5', group: 'Company', kind: 'hq', target: 5, reward: 5 * M },
  { id: 'staff-5', group: 'Company', kind: 'staff', target: 5, reward: 0.5 * M },
  { id: 'research-5', group: 'Research', kind: 'researched', target: 5, reward: 0.5 * M },
  { id: 'research-20', group: 'Research', kind: 'researched', target: 20, reward: 2 * M },
  { id: 'research-50', group: 'Research', kind: 'researched', target: 50, reward: 6 * M },
  { id: 'year-1980', group: 'Survival', kind: 'year', target: 1980, reward: 1 * M },
  { id: 'year-2000', group: 'Survival', kind: 'year', target: 2000, reward: 4 * M },
  { id: 'year-2020', group: 'Survival', kind: 'year', target: 2020, reward: 10 * M },
]

export const ACHIEVEMENT_GROUPS: AchievementGroup[] = ['Sales', 'Money', 'Market', 'Company', 'Research', 'Survival']

/** The current value of what an achievement measures. */
export function measure(kind: AchievementKind, world: World): number {
  switch (kind) {
    case 'sold':
      return world.company.totalCarsSoldAllModels
    case 'cash':
      return world.bank.balance
    case 'share':
      return world.company.marketSharePercent
    case 'reach':
      return world.company.populationServed
    case 'reputation':
      return world.company.reputationPercent
    case 'models':
      return world.vehicles.models.filter((m) => !isInDevelopment(m)).length
    case 'researched':
      return Object.values(world.research.nodeRuntime).filter((r) => r.researched).length
    case 'lines':
      return world.factory.lines.length
    case 'lineLevel':
      return Math.max(0, ...world.factory.lines.map((l) => l.level))
    case 'hq':
      return world.company.hqLevel
    case 'staff':
      return world.staff.employees.length
    case 'year':
      return world.time.currentDate.year
    case 'rank': {
      const ours = world.company.marketSharePercent
      return world.company.totalCarsSoldAllModels > 0 && world.rivals.rivals.every((r) => ours > r.sharePercent) ? 1 : 0
    }
  }
}

/** 0-1 progress toward an achievement. */
export function progress01(def: AchievementDefinition, world: World): number {
  if (def.kind === 'year') {
    // "Survive until 1980" is measured from the start of the game.
    const start = 1970
    return Math.min(1, Math.max(0, (world.time.currentDate.year - start) / (def.target - start)))
  }
  return Math.min(1, Math.max(0, measure(def.kind, world) / def.target))
}

export function isUnlocked(state: AchievementsState, id: string): boolean {
  return id in state.unlocked
}

/**
 * Unlocks every achievement whose target has been reached. Each one pays its cash reward and
 * posts a News headline - unless `silent`, used when loading a save made before achievements
 * existed (everything already earned is credited without a payout or a flood of headlines).
 * Returns the newly unlocked ids.
 */
export function checkAchievements(world: World, today: GameDate, silent = false): string[] {
  const state = world.achievements
  const unlocked: string[] = []
  for (const def of ACHIEVEMENTS) {
    if (isUnlocked(state, def.id)) continue
    if (measure(def.kind, world) < def.target) continue
    state.unlocked[def.id] = { year: today.year, month: today.month, day: today.day }
    unlocked.push(def.id)
    if (silent) continue
    depositRecorded(world.bank, world.ledger, def.reward, 'Reward', today)
    postNews(world.news, 'AchievementUnlocked', today, { achievementId: def.id, reward: def.reward })
  }
  return unlocked
}

/** The closest-to-done achievements still to earn, for the Office "next goal" strip. */
export function nextGoals(world: World, count: number): { def: AchievementDefinition; progress: number }[] {
  return ACHIEVEMENTS.filter((a) => !isUnlocked(world.achievements, a.id))
    .map((def) => ({ def, progress: progress01(def, world) }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, count)
}
