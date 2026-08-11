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
  const back = useUiStore((s) => s.back)
  const goHome = useUiStore((s) => s.goHome)
  const canGoBack = useUiStore((s) => s.history.length > 0)
  const show = useUiStore((s) => s.show)

  // Subscribing to revision is enough to re-render this bar whenever anything in the world
  // changes; the actual values are read fresh from world below.
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const setPlaybackSpeed = useGameStore((s) => s.setPlaybackSpeed)

  if (!screenWantsTopHud(currentScreen)) return null

  const { company, time, bank } = world
  // Office Hub is home - there's nothing to go "back" to from there, so that slot shows a home
  // icon instead of a (mostly-disabled) back arrow. Every other screen keeps the working back
  // arrow that was already there.
  const isHome = currentScreen === 'OfficeHub'

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Button
          className={styles.iconButton}
          onClick={isHome ? () => goHome('OfficeHub') : back}
          disabled={!isHome && !canGoBack}
          aria-label={isHome ? 'Home' : 'Back'}
        >
          {isHome ? '🏠' : '‹'}
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
