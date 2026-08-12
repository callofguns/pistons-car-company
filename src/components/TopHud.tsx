import { useGameStore } from '../store/useGameStore'
import { screenWantsTopHud, SCREEN_TITLES, useUiStore } from '../store/useUiStore'
import { compact, percent } from '../core/numberFormat'
import { formatDate } from '../core/gameDate'
import { Button } from './Primitives'
import { HudPill } from './HudPill'
import styles from './TopHud.module.css'

/**
 * The persistent chrome bar: back/home + current screen title (left), stat pills (center),
 * finance + playback controls (right). Direct port of TopHudView.cs.
 */
export function TopHud() {
  const currentScreen = useUiStore((s) => s.currentScreen)
  const goHome = useUiStore((s) => s.goHome)
  const show = useUiStore((s) => s.show)

  // Subscribing to revision is enough to re-render this bar whenever anything in the world
  // changes; the actual values are read fresh from world below.
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const setPlaybackSpeed = useGameStore((s) => s.setPlaybackSpeed)

  if (!screenWantsTopHud(currentScreen)) return null

  const { company, time, bank } = world

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        {/* Always jumps straight to Office Hub - it used to fall back to back() off Office Hub,
            which walked the raw navigation history one hop at a time instead. That stack can hold
            a stale screen (e.g. the just-finalized Car Design wizard, which renders as "No design
            in progress" once its session is spent) so a single "back" step didn't reliably get the
            player home. goHome() also clears history/payload outright, so this can't leave stale
            state behind for a later back() to trip over either. */}
        <Button className={styles.iconButton} onClick={() => goHome('OfficeHub')} aria-label="Home">
          🏠
        </Button>
        <div className={styles.titleColumn}>
          <span className={styles.menuLabel}>Menu</span>
          <span className={styles.screenTitle}>{SCREEN_TITLES[currentScreen].toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.pills}>
        <HudPill icon="👑" value={percent(company.reputationPercent, 1)} />
        <HudPill icon="👥" value={compact(company.populationServed)} />
        <HudPill icon="💰" value={compact(bank.balance)} />
        <HudPill icon="🗓️" value={formatDate(time.currentDate)} />
        {/* A negative balance is a genuine emergency (it's what feeds the bankruptcy countdown) -
            this pill only appears then, on top of the balance pill above, so it stands out. */}
        {bank.balance < 0 && <span className={styles.debtPill}>⚠ IN DEBT</span>}
      </div>

      <div className={styles.right}>
        <Button variant="gold" className={styles.iconButton} onClick={() => show('Bank')} aria-label="Shop">
          $
        </Button>
        <Button
          className={`${styles.iconButton} ${time.manuallyPaused ? styles.playbackActive : ''}`}
          onClick={() => setPlaybackSpeed('paused')}
          aria-label="Pause"
        >
          ⏸
        </Button>
        <Button
          className={`${styles.iconButton} ${!time.manuallyPaused && time.speedMultiplier === 1 ? styles.playbackActive : ''}`}
          onClick={() => setPlaybackSpeed('normal')}
          aria-label="Play"
        >
          ▶
        </Button>
        <Button
          className={`${styles.iconButton} ${!time.manuallyPaused && time.speedMultiplier > 1 ? styles.playbackActive : ''}`}
          onClick={() => setPlaybackSpeed('fast')}
          aria-label="Fast forward"
        >
          ⏩
        </Button>
      </div>
    </div>
  )
}
