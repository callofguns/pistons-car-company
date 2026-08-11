import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { ModelSalesRow } from '../components/ModelSalesRow'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** The true home screen - no top HUD (matches the reference). Also the only screen where game time advances - see useSimulationLoop. */
export function OfficeHubScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const beginNewDesign = useGameStore((s) => s.beginNewDesign)

  const topModels = [...models].sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings).slice(0, 4)

  return (
    <div className={styles.screen}>
      <Heading>OFFICE</Heading>

      <Heading style={{ fontSize: '1.1rem' }}>SALES</Heading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 100 }}>
        {topModels.length === 0 && <span className={styles.empty}>No models yet - design your first car.</span>}
        {topModels.map((model) => (
          <ModelSalesRow key={model.id} model={model} onClick={() => show('SalesStatistics', model.id)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button onClick={() => show('Research')}>R&D</Button>
        <Button onClick={() => show('Promotion')}>Promo</Button>
        <Button onClick={() => show('ModelLineup')}>Models</Button>
        <Button onClick={() => show('TeamCreation')}>Racing</Button>
        <Button onClick={() => show('Employees')}>Staff</Button>
      </div>

      <Button
        variant="primary"
        style={{ marginTop: 'auto' }}
        onClick={() => {
          beginNewDesign()
          show('BodySelection')
        }}
      >
        CREATE CAR
      </Button>
    </div>
  )
}
