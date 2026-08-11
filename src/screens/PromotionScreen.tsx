import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { isTierUnlocked } from '../core/marketing'
import { PromotionTierCard } from '../components/PromotionTierCard'
import { CarCarousel } from '../components/CarCarousel'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** The two-step "SELECT PROMOTION METHOD" flow: pick a tier card, then pick which model to run it on (skipped if a model was passed in as navigation payload, e.g. from Sales Statistics' "LAUNCH MARKETING"). */
export function PromotionScreen() {
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const startCampaign = useGameStore((s) => s.startCampaign)

  const fixedModelId = typeof payload === 'string' ? payload : null
  const [tierId, setTierId] = useState<string | null>(null)
  const [carIndex, setCarIndex] = useState(() => (fixedModelId ? models.findIndex((m) => m.id === fixedModelId) : 0))

  if (!tierId) {
    return (
      <div className={styles.screen}>
        <Heading>Select Promotion Method</Heading>
        <div className={styles.grid}>
          {CATALOG.promotionTiers.map((tier) => (
            <PromotionTierCard
              key={tier.id}
              tier={tier}
              unlocked={isTierUnlocked(tier, currentYear)}
              onSelect={() => setTierId(tier.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>No models to promote yet.</span>
      </div>
    )
  }

  const index = Math.max(0, Math.min(carIndex, models.length - 1))
  const model = models[index]

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`}>
      <Heading>Select Promotion Method</Heading>
      <CarCarousel
        indexOneBased={index + 1}
        total={models.length}
        onPrevious={() => setCarIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCarIndex((i) => Math.min(models.length - 1, i + 1))}
      />
      <span style={{ fontWeight: 700 }}>{model.name}</span>
      <Button
        variant="primary"
        style={{ width: '100%' }}
        onClick={() => {
          if (startCampaign(model.id, tierId)) show('SalesStatistics', model.id)
        }}
      >
        CONFIRM
      </Button>
    </div>
  )
}
