import { useEffect, useRef, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { achievementName } from '../i18n/achievements'
import { useT } from '../i18n/useT'
import styles from './AchievementToast.module.css'

const SHOW_MS = 4500

/** A banner that drops in from the top when an achievement unlocks, whatever screen you are on. */
export function AchievementToast() {
  const { t, fmt } = useT()
  const [shown, setShown] = useState<{ id: string; reward: number } | null>(null)
  const lastNewsId = useRef<string | null>(null)
  const watchedWorld = useRef<object | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useGameStore.subscribe((state) => {
      const world = state.world
      const newest = world.news.entries[0]
      // A different world object means a game was loaded or started: just re-sync.
      if (world !== watchedWorld.current) {
        watchedWorld.current = world
        lastNewsId.current = newest?.id ?? null
        return
      }
      if (!newest || newest.id === lastNewsId.current) return
      lastNewsId.current = newest.id
      if (newest.type !== 'AchievementUnlocked') return
      setShown({ id: String(newest.params.achievementId), reward: Number(newest.params.reward) })
      clearTimeout(timer)
      timer = setTimeout(() => setShown(null), SHOW_MS)
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  if (!shown) return null
  return (
    <div className={styles.toast} role="status">
      <Trophy size={22} />
      <div className={styles.text}>
        <span className={styles.title}>{t('goals.toastTitle')}</span>
        <span>
          {achievementName(shown.id, t)} · {fmt.money(shown.reward)}
        </span>
      </div>
    </div>
  )
}
