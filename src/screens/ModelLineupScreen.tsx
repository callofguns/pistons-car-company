import { useEffect, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { grouped, plainCurrency, compact } from '../core/numberFormat'
import { formatDate } from '../core/gameDate'
import { CarCarousel } from '../components/CarCarousel'
import { StatRow } from '../components/StatRow'
import { TutorialCard } from '../components/TutorialCard'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** The full spec-sheet browser matching the reference's "Coupe B250 / LUXURY + SPORT / 10/10" screen, with "CREATE RESTYLING" to spin up a new design pre-filled from the current model. */
export function ModelLineupScreen() {
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const beginRestyling = useGameStore((s) => s.beginRestyling)

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (typeof payload === 'string') {
      const i = models.findIndex((m) => m.id === payload)
      if (i >= 0) setIndex(i)
    } else {
      setIndex((i) => Math.min(i, Math.max(0, models.length - 1)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const tutorialStep = useActiveTutorialStep()

  if (models.length === 0) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>No models designed yet.</span>
      </div>
    )
  }

  const model = models[Math.min(index, models.length - 1)]
  const s = model.stats

  return (
    <div className={styles.screen}>
      {tutorialStep && <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />}
      <CarCarousel
        indexOneBased={index + 1}
        total={models.length}
        onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(models.length - 1, i + 1))}
      />
      <Heading style={{ textAlign: 'center' }}>{model.name}</Heading>
      <span style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>{model.categoryTag}</span>

      <div className={styles.columns}>
        <div className={styles.column}>
          <StatRow label="Power" value={`${Math.round(s.powerHp)} HP`} />
          <StatRow label="Torque" value={`${Math.round(s.torqueNm)} NM @${Math.round(s.torqueRpm)} RPM`} />
          <StatRow label="Engine Volume" value={`${model.engine.displacementLiters.toFixed(1)} L`} />
          <StatRow label="Fuel consumption" value={`${s.fuelConsumptionL100Km.toFixed(1)} L/100KM`} />
          <StatRow label="Reliability" value={`${Math.round(s.reliabilityPercent)} %`} />
          <StatRow label="Emissions" value={`${Math.round(s.emissionsGKm)} G/KM`} />
          <StatRow label="Repair cost" value={plainCurrency(s.repairCost)} />
          <StatRow label="Weight" value={`${Math.round(s.weightKg)} KG`} />
          <StatRow label="Max RPM" value={`${Math.round(s.maxRpm)}`} />
          <StatRow label="0-100" value={`${s.zeroToHundredSec.toFixed(1)} SEC`} />
        </div>
        <div className={styles.column}>
          <StatRow label="Rating" value={String(s.rating)} />
          <StatRow label="Cars sold" value={grouped(model.totalSold)} />
          <StatRow label="Earnings" value={compact(model.lifetimeEarnings)} />
          <StatRow label="Year of issue" value={formatDate(model.issueDate)} />
          <StatRow label="Cost price" value={plainCurrency(model.unitCost)} />
          <StatRow label="Price" value={plainCurrency(model.salePrice)} />
        </div>
      </div>

      <Button
        onClick={() => {
          beginRestyling(model.id)
          show('BodySelection')
        }}
      >
        CREATE RESTYLING
      </Button>
    </div>
  )
}
