import { ArrowLeft, Banknote, Crown, FastForward, FlaskConical, Pause, Play, ShoppingCart, TriangleAlert, Users, Warehouse } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { screenWantsTopHud, SCREEN_TITLE_KEYS, useUiStore } from '../store/useUiStore'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button } from './Primitives'
import { HudPill } from './HudPill'
import styles from './TopHud.module.css'

const ICON_SIZE = 16

/**
 * The persistent chrome bar, laid out like the reference: back arrow + current screen title
 * (left); reputation, reach, day, a big year medallion, month, cash and research points (center),
 * with the playback controls tucked under the year; the gold shop (Finance) and garage (main menu)
 * buttons (right). Direct port of TopHudView.cs.
 */
export function TopHud() {
  const currentScreen = useUiStore((s) => s.currentScreen)
  const goHome = useUiStore((s) => s.goHome)
  const show = useUiStore((s) => s.show)
  const back = useUiStore((s) => s.back)
  // Office Hub is always entered with an empty back-stack (see goHome('OfficeHub') call sites),
  // so it never shows the arrow - every screen opened from it does.
  const historyBack = useUiStore((s) => s.history.length > 0)
  const hudOverride = useUiStore((s) => s.hudOverride)
  const canGoBack = historyBack || hudOverride !== null

  // Subscribing to revision is enough to re-render this bar whenever anything in the world
  // changes; the actual values are read fresh from world below.
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const setPlaybackSpeed = useGameStore((s) => s.setPlaybackSpeed)
  const saveNow = useGameStore((s) => s.saveNow)
  const { t, fmt } = useT()

  if (!screenWantsTopHud(currentScreen)) return null

  const { company, time, bank, research } = world
  const inDebt = bank.balance < 0
  const paused = time.manuallyPaused
  const fast = !paused && time.speedMultiplier > 1

  // Exits the current session back to the title screen, from anywhere. Saves first so Continue on
  // Main Menu picks this session back up exactly where it left off, same as if the tab had just
  // been closed here. goHome() clears history/payload outright, so nothing stale is left for the
  // CarDesign/BodySelection screens' own back buttons to wander back into later.
  const goToMainMenu = () => {
    saveNow()
    goHome('MainMenu')
  }

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        {canGoBack && (
          <Button className={styles.squareButton} onClick={hudOverride?.onBack ?? back} aria-label={t('common.back')}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </Button>
        )}
        {currentScreen !== 'OfficeHub' && (
          <div className={styles.titleColumn}>
            <span className={styles.menuLabel}>{hudOverride?.menuLabel ?? t('common.menu')}</span>
            <span className={styles.screenTitle}>{hudOverride?.title ?? t(SCREEN_TITLE_KEYS[currentScreen])}</span>
          </div>
        )}
      </div>

      <div className={styles.center}>
        <HudPill
          className={styles.widePill}
          icon={<Crown size={ICON_SIZE} color="var(--color-trim)" fill="var(--color-trim)" />}
          value={fmt.percent(company.reputationPercent, 0)}
          label={t('hud.reputation')}
        />
        <HudPill
          className={styles.widePill}
          icon={<Users size={ICON_SIZE} color="#f59e4b" />}
          value={fmt.compact(company.populationServed)}
          label={t('hud.reach')}
        />
        <HudPill value={String(time.currentDate.day)} label={t('hud.day')} className={styles.centeredPill} />

        <div className={styles.yearBlock}>
          <div className={styles.year} aria-label={`${t('hud.year')}: ${time.currentDate.year}`}>
            {time.currentDate.year}
          </div>
          <div className={styles.playback}>
            <button
              className={`${styles.playbackButton} ${paused ? styles.playbackActive : ''}`}
              onClick={() => setPlaybackSpeed('paused')}
              aria-label={t('common.pause')}
              aria-pressed={paused}
            >
              <Pause size={11} fill="currentColor" />
            </button>
            <button
              className={`${styles.playbackButton} ${!paused && !fast ? styles.playbackActive : ''}`}
              onClick={() => setPlaybackSpeed('normal')}
              aria-label={t('common.play')}
              aria-pressed={!paused && !fast}
            >
              <Play size={11} fill="currentColor" />
            </button>
            <button
              className={`${styles.playbackButton} ${fast ? styles.playbackActive : ''}`}
              onClick={() => setPlaybackSpeed('fast')}
              aria-label={t('common.fastForward')}
              aria-pressed={fast}
            >
              <FastForward size={11} fill="currentColor" />
            </button>
          </div>
        </div>

        <HudPill
          value={t(`month.${time.currentDate.month}.abbr` as MessageKey)}
          label={t('hud.month')}
          className={styles.centeredPill}
        />
        {/* A negative balance is a genuine emergency (it's what feeds the bankruptcy countdown) -
            the cash pill itself turns red, with a warning icon, rather than adding another pill. */}
        <HudPill
          className={styles.widePill}
          icon={inDebt ? <TriangleAlert size={ICON_SIZE} color="var(--color-danger)" /> : <Banknote size={ICON_SIZE} color="var(--color-green)" />}
          value={fmt.compact(bank.balance)}
          label={inDebt ? `${t('hud.cash')} - ${t('hud.inDebt')}` : t('hud.cash')}
          tone={inDebt ? 'danger' : 'normal'}
        />
        <HudPill
          className={styles.widePill}
          icon={<FlaskConical size={ICON_SIZE} color="#8fb4ff" />}
          value={fmt.compact(research.points)}
          label={t('hud.researchPoints')}
        />
      </div>

      <div className={styles.right}>
        <Button variant="gold" className={styles.squareButton} onClick={() => show('Bank')} aria-label={t('common.shop')}>
          <ShoppingCart size={22} strokeWidth={2.25} />
        </Button>
        <Button className={`${styles.squareButton} ${styles.garageButton}`} onClick={goToMainMenu} aria-label={t('common.mainMenu')}>
          <Warehouse size={22} strokeWidth={2.25} />
        </Button>
      </div>
    </div>
  )
}
