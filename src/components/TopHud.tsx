import { useGameStore } from '../store/useGameStore'
import { screenWantsTopHud, SCREEN_TITLES, useUiStore } from '../store/useUiStore'
import { compact } from '../core/numberFormat'
import { monthAbbreviation } from '../core/gameDate'
import { percent } from '../core/numberFormat'
import { Button } from './Primitives'
import { HudPill } from './HudPill'
import styles from './TopHud.module.css'

/**
 * The persistent chrome bar: back button + current screen title (left), stat pills (center),
 * shop/home (right). Direct port of TopHudView.cs, minus the cash and research-point pills for
 * this pass (see the web-pivot plan) - Bank and research points are still fully simulated, just
 * not shown in this bar yet.
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

  if (!screenWantsTopHud(currentScreen)) return null

  const { company, time, bank } = world

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Button className={styles.iconButton} onClick={back} disabled={!canGoBack} aria-label="Back">
          ‹
        </Button>
        <div className={styles.titleColumn}>
          <span className={styles.menuLabel}>Menu</span>
          <span className={styles.screenTitle}>{SCREEN_TITLES[currentScreen].toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.pills}>
        <HudPill icon="👑" value={percent(company.reputationPercent, 1)} />
        <HudPill icon="👥" value={compact(company.populationServed)} />
        <HudPill icon="📅" value={String(time.currentDate.day)} />
        <HudPill icon="🗓️" value={`${time.currentDate.year} ${monthAbbreviation(time.currentDate)}`} />
        {/* Cash itself stays off the persistent HUD by design, but a negative balance is a genuine
            emergency (it's what feeds the bankruptcy countdown) - this pill only appears then, so
            a player browsing other screens still gets a warning signal. */}
        {bank.balance < 0 && <span className={styles.debtPill}>⚠ IN DEBT</span>}
      </div>

      <div className={styles.right}>
        <Button variant="gold" className={styles.iconButton} onClick={() => show('Bank')} aria-label="Shop">
          $
        </Button>
        <Button className={styles.iconButton} onClick={() => goHome('OfficeHub')} aria-label="Home">
          🏠
        </Button>
      </div>
    </div>
  )
}
