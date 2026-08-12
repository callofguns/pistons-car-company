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
  const saveNow = useGameStore((s) => s.saveNow)

  if (!screenWantsTopHud(currentScreen)) return null

  const { company, time, bank } = world

  // Exits the current session back to the title screen (Continue/New Game/...), from anywhere -
  // not just Office Hub, which is why it's not called "home" in code even though the icon still
  // reads that way to the player. Saves first so Continue on Main Menu picks this session back up
  // exactly where it left off, same as if the tab had just been closed here. goHome() clears
  // history/payload outright, so nothing stale is left for the CarDesign/BodySelection screens'
  // own back buttons to wander back into later.
  const goToMainMenu = () => {
    saveNow()
    goHome('MainMenu')
  }

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Button className={styles.iconButton} onClick={goToMainMenu} aria-label="Main Menu">
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
