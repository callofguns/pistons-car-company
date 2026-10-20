import type { ComponentType } from 'react'
import { Trophy, Building2, Car, Factory, Flag, FlaskConical, Megaphone, Newspaper, Swords, UserPlus, type LucideProps } from 'lucide-react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { unreadNewsCount } from '../core/news'
import { carsOnOrder } from '../core/factory'
import { nextGoals } from '../core/achievements'
import { achievementName } from '../i18n/achievements'
import type { ScreenId } from '../store/screenId'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { OfficeArt } from '../art/OfficeArt'
import { ModelSalesRow } from '../components/ModelSalesRow'
import { Button } from '../components/Primitives'
import styles from './OfficeHubScreen.module.css'

interface NavItem {
  screen: ScreenId
  labelKey: MessageKey
  Icon: ComponentType<LucideProps>
}

const NAV_ITEMS: NavItem[] = [
  { screen: 'Research', labelKey: 'nav.research', Icon: FlaskConical },
  { screen: 'Promotion', labelKey: 'nav.promotion', Icon: Megaphone },
  { screen: 'ModelLineup', labelKey: 'nav.models', Icon: Car },
  { screen: 'Factory', labelKey: 'nav.factory', Icon: Factory },
  { screen: 'TeamCreation', labelKey: 'nav.racing', Icon: Flag },
  { screen: 'Employees', labelKey: 'nav.staff', Icon: UserPlus },
  { screen: 'Rivals', labelKey: 'nav.rivals', Icon: Swords },
  { screen: 'Company', labelKey: 'nav.company', Icon: Building2 },
  { screen: 'News', labelKey: 'nav.news', Icon: Newspaper },
]

/** The true home screen, laid out like the reference: the company's isometric office (which
 * changes with each HQ level) in the middle, the SALES panel on the right, icon-only navigation
 * along the bottom-left, and CREATE CAR set apart bottom-right as the primary action. Also the
 * only screen where game time advances - see useSimulationLoop. Finance is one tap away via the
 * top bar's gold shop button. */
export function OfficeHubScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const factory = useGameStore((s) => s.world.factory)
  const news = useGameStore((s) => s.world.news)
  const hqLevel = useGameStore((s) => s.world.company.hqLevel)
  const beginNewDesign = useGameStore((s) => s.beginNewDesign)
  const tutorialStep = useActiveTutorialStep()
  const { t } = useT()

  const topModels = [...models].sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings).slice(0, 4)
  const unread = unreadNewsCount(news)
  const world = useGameStore((s) => s.world)
  const goal = nextGoals(world, 1)[0]

  return (
    <div className={styles.hub}>
      <div className={styles.artArea}>
        <OfficeArt level={hqLevel} className={styles.art} title={t('screen.officeHub.title')} />
      </div>

      <section className={styles.salesPanel} aria-label={t('officeHub.sales')}>
        <h2 className={styles.salesTitle}>{t('officeHub.sales')}</h2>
        <div className={styles.salesFrame}>
          {topModels.length === 0 && <span className={styles.empty}>{t('officeHub.noModels')}</span>}
          {topModels.map((model) => (
            <ModelSalesRow
              key={model.id}
              model={model}
              onOrder={carsOnOrder(factory, model.id)}
              onClick={() => show('SalesStatistics', model.id)}
            />
          ))}
        </div>
        <button className={styles.goal} onClick={() => show('Goals')}>
          <Trophy size={16} />
          <span className={styles.goalText}>
            <span className={styles.goalName}>{goal ? `${t('goals.nextGoal')}: ${achievementName(goal.def.id, t)}` : t('goals.allDone')}</span>
            {goal && (
              <span className={styles.goalTrack}>
                <span className={styles.goalBar} style={{ transform: `scaleX(${goal.progress})` }} />
              </span>
            )}
          </span>
        </button>
      </section>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ screen, labelKey, Icon }) => (
          <Button
            key={screen}
            data-tutorial-target={screen === 'Factory' ? 'office-factory' : undefined}
            className={`${styles.navButton} ${screen === 'Factory' && tutorialStep?.step.targetId === 'office-factory' ? 'tutorial-target-highlight' : ''}`}
            onClick={() => show(screen)} aria-label={t(labelKey)} title={t(labelKey)}>
            <Icon size={26} strokeWidth={2.1} />
            {screen === 'News' && unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
          </Button>
        ))}
      </nav>

      <Button
        variant="primary"
        data-tutorial-target="office-create-car"
        className={`${styles.createCarButton} ${tutorialStep?.step.targetId === 'office-create-car' ? 'tutorial-target-highlight' : ''}`}
        onClick={() => {
          beginNewDesign()
          show('BodySelection')
        }}
      >
        {t('officeHub.createCar')}
      </Button>
    </div>
  )
}
