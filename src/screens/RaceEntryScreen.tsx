import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { isRaceTierUnlocked } from '../core/racing'
import { useT } from '../i18n/useT'
import { RaceTierCard } from '../components/RaceTierCard'
import { CarCarousel } from '../components/CarCarousel'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** The two-step "ENTER A RACE" flow - structural clone of PromotionScreen: pick a tier card, then
 * pick which model enters it. Reached only from TeamCreationScreen's "ENTER A RACE" button, which
 * only renders once registered and with no entry already pending. */
export function RaceEntryScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const enterRace = useGameStore((s) => s.enterRace)
  const { t } = useT()

  const [tierId, setTierId] = useState<string | null>(null)
  const [carIndex, setCarIndex] = useState(0)
  const [error, setError] = useState(false)

  if (!tierId) {
    return (
      <div className={styles.screen}>
        <Heading>{t('race.selectTier')}</Heading>
        <div className={styles.grid}>
          {CATALOG.raceTiers.map((tier) => (
            <RaceTierCard key={tier.id} tier={tier} unlocked={isRaceTierUnlocked(tier, currentYear)} onSelect={() => setTierId(tier.id)} />
          ))}
        </div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>{t('race.noModels')}</span>
      </div>
    )
  }

  const index = Math.max(0, Math.min(carIndex, models.length - 1))
  const model = models[index]

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`}>
      <Heading>{t('race.selectTier')}</Heading>
      <CarCarousel
        indexOneBased={index + 1}
        total={models.length}
        onPrevious={() => setCarIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCarIndex((i) => Math.min(models.length - 1, i + 1))}
      />
      <span style={{ fontWeight: 700 }}>{model.name}</span>

      {error && <span style={{ color: 'var(--color-danger)' }}>{t('race.notEnoughCash')}</span>}

      <Button
        variant="primary"
        style={{ width: '100%' }}
        onClick={() => {
          if (enterRace(tierId, model.id)) {
            show('TeamCreation')
          } else {
            setError(true)
          }
        }}
      >
        {t('race.confirm')}
      </Button>
    </div>
  )
}
