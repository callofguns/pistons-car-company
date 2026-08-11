import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { ModelSalesRow } from '../components/ModelSalesRow'
import { SalesGraph } from '../components/SalesGraph'
import { Button, Heading } from '../components/Primitives'
import styles from './OfficeHubScreen.module.css'

/** The true home screen. Also the only screen where game time advances - see useSimulationLoop.
 * Corner-anchored layout: current models being sold + their sales graph top-left, every
 * navigation button (including starting a new design) clustered bottom-left, and Finance set
 * apart bottom-right as its own "credit card" button. */
export function OfficeHubScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const beginNewDesign = useGameStore((s) => s.beginNewDesign)

  const topModels = [...models].sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings).slice(0, 4)

  return (
    <div className={styles.hub}>
      <div className={styles.topLeft}>
        <Heading style={{ fontSize: '1.1rem' }}>SALES</Heading>
        <div className={styles.modelsList}>
          {topModels.length === 0 && <span className={styles.empty}>No models yet - design your first car.</span>}
          {topModels.map((model) => (
            <ModelSalesRow key={model.id} model={model} onClick={() => show('SalesStatistics', model.id)} />
          ))}
        </div>
        {topModels.length > 0 && <SalesGraph models={topModels} />}
      </div>

      <div className={styles.bottomLeft}>
        <Button
          variant="primary"
          onClick={() => {
            beginNewDesign()
            show('BodySelection')
          }}
        >
          CREATE CAR
        </Button>
        <Button onClick={() => show('Research')}>R&D</Button>
        <Button onClick={() => show('Promotion')}>Promo</Button>
        <Button onClick={() => show('ModelLineup')}>Models</Button>
        <Button onClick={() => show('TeamCreation')}>Racing</Button>
        <Button onClick={() => show('Employees')}>Staff</Button>
      </div>

      <Button variant="gold" className={styles.financeButton} onClick={() => show('Bank')}>
        💳 FINANCE
      </Button>
    </div>
  )
}
