import { useState, type ComponentType } from 'react'
import { Building2, Check, Coins, FlaskConical, Globe, Hourglass, ShoppingCart, type LucideProps } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, isUnlocked, progress01, type AchievementGroup } from '../core/achievements'
import { achievementDescription, achievementName } from '../i18n/achievements'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { ProgressButton } from '../components/ProgressButton'
import goalStyles from './GoalsScreen.module.css'

const GROUP_ICONS: Record<AchievementGroup, ComponentType<LucideProps>> = {
  Sales: ShoppingCart,
  Money: Coins,
  Market: Globe,
  Company: Building2,
  Research: FlaskConical,
  Survival: Hourglass,
}

/** Every achievement, by group: the groups down the left (with how many are done), and a card
 * per achievement on the right with a progress bar, its cash reward, or the date it was won. */
export function GoalsScreen() {
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const { t, fmt } = useT()
  const [selected, setSelected] = useState<AchievementGroup>('Sales')

  const totalDone = ACHIEVEMENTS.filter((a) => isUnlocked(world.achievements, a.id)).length
  const inGroup = ACHIEVEMENTS.filter((a) => a.group === selected)

  return (
    <div className={goalStyles.page}>
      <nav className={goalStyles.sidebar}>
        <span className={goalStyles.total}>{t('goals.progress', { done: totalDone, total: ACHIEVEMENTS.length })}</span>
        {ACHIEVEMENT_GROUPS.map((group) => {
          const items = ACHIEVEMENTS.filter((a) => a.group === group)
          const done = items.filter((a) => isUnlocked(world.achievements, a.id)).length
          const Icon = GROUP_ICONS[group]
          return (
            <ProgressButton
              key={group}
              label={t(`achievement.group.${group}` as MessageKey)}
              icon={<Icon size={22} />}
              progress01={done / items.length}
              active={group === selected}
              onClick={() => setSelected(group)}
            />
          )
        })}
      </nav>

      <div className={goalStyles.grid}>
        {inGroup.map((def) => {
          const date = world.achievements.unlocked[def.id]
          const done = date !== undefined
          const progress = done ? 1 : progress01(def, world)
          return (
            <div key={def.id} className={`${goalStyles.card} ${done ? goalStyles.done : ''}`}>
              <div className={goalStyles.top}>
                <span className={goalStyles.badge} aria-hidden="true">
                  {done ? <Check size={18} strokeWidth={3} /> : `${Math.floor(progress * 100)}%`}
                </span>
                <span className={goalStyles.name}>{achievementName(def.id, t)}</span>
              </div>
              <span className={goalStyles.desc}>{achievementDescription(def, t, fmt)}</span>
              <div className={goalStyles.track}>
                <div className={goalStyles.bar} style={{ transform: `scaleX(${progress})` }} />
              </div>
              <span className={goalStyles.reward}>{done ? t('goals.unlocked', { date: fmt.date(date) }) : t('goals.reward', { reward: fmt.money(def.reward) })}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
