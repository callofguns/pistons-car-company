import { ACHIEVEMENTS, type AchievementDefinition } from '../core/achievements'
import { grouped } from '../core/numberFormat'
import type { useT } from './useT'
import type { MessageKey } from './keys'
import type { Formatters } from './format'

type T = ReturnType<typeof useT>['t']

export function achievementName(id: string, t: T): string {
  return t(`data.achievement.${id}.name` as MessageKey)
}

/** The target as the player reads it: "$100.0 M", "25%", "1,000,000". */
function formatTarget(def: AchievementDefinition, fmt: Formatters): string {
  switch (def.kind) {
    case 'cash':
      return fmt.money(def.target)
    case 'share':
    case 'reputation':
      return `${def.target}%`
    case 'year':
    case 'rank':
      return String(def.target)
    default:
      return grouped(def.target)
  }
}

export function achievementDescription(def: AchievementDefinition, t: T, fmt: Formatters): string {
  return t(`achievement.desc.${def.kind}` as MessageKey, { target: formatTarget(def, fmt) })
}

export function achievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
