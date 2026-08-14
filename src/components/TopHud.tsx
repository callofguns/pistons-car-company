import { useGameStore } from '../store/useGameStore'
import { screenWantsTopHud, SCREEN_TITLE_KEYS, useUiStore } from '../store/useUiStore'
import { useT } from '../i18n/useT'
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
  const { t, fmt } = useT()

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
        <Button className={styles.iconButton} onClick={goToMainMenu} aria-label={t('common.mainMenu')}>
          🏠
        </Button>
        <div className={styles.titleColumn}>
          <span className={styles.menuLabel}>{t('common.menu')}</span>
          <span className={styles.screenTitle}>{t(SCREEN_TITLE_KEYS[currentScreen])}</span>
        </div>
      </div>

      <div className={styles.pills}>
        <HudPill icon="👑" value={fmt.percent(company.reputationPercent, 1)} />
        <HudPill icon="👥" value={fmt.compact(company.populationServed)} />
        <HudPill icon="💰" value={fmt.compact(bank.balance)} />
        <HudPill icon="🗓️" value={fmt.date(time.currentDate)} />
        {/* A negative balance is a genuine emergency (it's what feeds the bankruptcy countdown) -
            this pill only appears then, on top of the balance pill above, so it stands out. */}
        {bank.balance < 0 && <span className={styles.debtPill}>⚠ {t('hud.inDebt')}</span>}
      </div>

      <div className={styles.right}>
        <Button variant="gold" className={styles.iconButton} onClick={() => show('Bank')} aria-label={t('common.shop')}>
          $
        </Button>
        <Button
          className={`${styles.iconButton} ${time.manuallyPaused ? styles.playbackActive : ''}`}
          onClick={() => setPlaybackSpeed('paused')}
          aria-label={t('common.pause')}
        >
          ⏸
        </Button>
        <Button
          className={`${styles.iconButton} ${!time.manuallyPaused && time.speedMultiplier === 1 ? styles.playbackActive : ''}`}
          onClick={() => setPlaybackSpeed('normal')}
          aria-label={t('common.play')}
        >
          ▶
        </Button>
        <Button
          className={`${styles.iconButton} ${!time.manuallyPaused && time.speedMultiplier > 1 ? styles.playbackActive : ''}`}
          onClick={() => setPlaybackSpeed('fast')}
          aria-label={t('common.fastForward')}
        >
          ⏩
        </Button>
      </div>
    </div>
  )
}
