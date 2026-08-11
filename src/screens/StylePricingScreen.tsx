import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { plainCurrency } from '../core/numberFormat'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

function generateDefaultName(carClass: string | undefined): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const number = 100 + Math.floor(Math.random() * 900)
  return `${carClass ?? 'Model'} ${letter}${number}`
}

/** Final wizard step - name, category tag, and price - then finalizeDesign() turns the session into a sellable CarModel. */
export function StylePricingScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const session = useGameStore((s) => s.world.vehicles.currentSession)
  const setNameAndCategory = useGameStore((s) => s.setNameAndCategory)
  const setCustomPrice = useGameStore((s) => s.setCustomPrice)
  const finalizeDesign = useGameStore((s) => s.finalizeDesign)
  const previewCurrentStats = useGameStore((s) => s.previewCurrentStats)

  const body = CATALOG.bodies.find((b) => b.id === session?.selectedBodyId)
  const stats = previewCurrentStats()

  const [name, setName] = useState(() => generateDefaultName(body?.carClass))
  const [category, setCategory] = useState(session?.categoryTag ?? '')
  const [price, setPrice] = useState(() => (stats ? Math.round(stats.suggestedPrice) : 0))
  const [error, setError] = useState('')

  if (!session) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>No design in progress.</span>
      </div>
    )
  }

  return (
    <div className={`${styles.screen} ${styles.narrow}`}>
      <Heading>Style &amp; Pricing</Heading>

      <label>
        Model name
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 10 }} />
      </label>

      <label>
        Category tag (e.g. LUXURY + SPORT)
        <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 10 }} />
      </label>

      <label>
        Price
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          style={{ width: '100%', padding: 10 }}
        />
      </label>

      {stats && <span style={{ color: 'var(--color-text-secondary)' }}>Suggested: {plainCurrency(stats.suggestedPrice)}</span>}
      {error && <span style={{ color: 'var(--color-red)' }}>{error}</span>}

      <Button
        variant="primary"
        onClick={() => {
          if (!name.trim()) {
            setError('Enter a model name.')
            return
          }
          setNameAndCategory(name.trim(), category.trim())
          if (price > 0) setCustomPrice(price)
          const modelId = finalizeDesign()
          if (!modelId) {
            setError('Could not finalize this design.')
            return
          }
          show('ModelLineup', modelId)
        }}
      >
        CONFIRM
      </Button>
    </div>
  )
}
