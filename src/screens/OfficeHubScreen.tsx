import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { unreadNewsCount } from '../core/news'
import { useT } from '../i18n/useT'
import { ModelSalesRow } from '../components/ModelSalesRow'
import { SalesGraph } from '../components/SalesGraph'
import { Button, Heading } from '../components/Primitives'
import styles from './OfficeHubScreen.module.css'

/** The true home screen. Also the only screen where game time advances - see useSimulationLoop.
 * Corner-anchored layout: current models being sold + their sales graph top-left, every
 * secondary navigation button laid out flat in a single row bottom-left, and Create Car set apart
 * bottom-right as its own elongated primary-action button. Finance is still one tap away via the
 * persistent top HUD's "$" button - it isn't duplicated here anymore. */
export function OfficeHubScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const news = useGameStore((s) => s.world.news)
  const beginNewDesign = useGameStore((s) => s.beginNewDesign)
  const tutorialStep = useActiveTutorialStep()
  const { t } = useT()

  const topModels = [...models].sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings).slice(0, 4)
  const unread = unreadNewsCount(news)

  return (
    <div className={styles.hub}>
      <div className={styles.topLeft}>
        <Heading style={{ fontSize: '1.1rem' }}>{t('officeHub.sales')}</Heading>
        <div className={styles.modelsList}>
          {topModels.length === 0 && <span className={styles.empty}>{t('officeHub.noModels')}</span>}
          {topModels.map((model) => (
            <ModelSalesRow key={model.id} model={model} onClick={() => show('SalesStatistics', model.id)} />
          ))}
        </div>
        {topModels.length > 0 && <SalesGraph models={topModels} />}
      </div>

      <div className={styles.bottomLeft}>
        <Button onClick={() => show('Research')}>{t('nav.research')}</Button>
        <Button onClick={() => show('Promotion')}>{t('nav.promotion')}</Button>
        <Button onClick={() => show('ModelLineup')}>{t('nav.models')}</Button>
        <Button onClick={() => show('TeamCreation')}>{t('nav.racing')}</Button>
        <Button onClick={() => show('Employees')}>{t('nav.staff')}</Button>
        <Button onClick={() => show('Company')}>{t('nav.company')}</Button>
        <Button className={styles.navButton} onClick={() => show('News')}>
          {t('nav.news')}
          {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
        </Button>
      </div>

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
