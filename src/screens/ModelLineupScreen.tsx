import { useEffect, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { grouped, plainCurrency } from '../core/numberFormat'
import { useT } from '../i18n/useT'
import { formatCategoryTag } from '../i18n/vehicles'
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
  const { t, fmt, locale } = useT()

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
        <span className={styles.empty}>{t('modelLineup.noModels')}</span>
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
      <span style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>{formatCategoryTag(model, locale)}</span>

      <div className={styles.columns}>
        <div className={styles.column}>
          <StatRow label={t('modelLineup.labelPower')} value={t('modelLineup.power', { value: Math.round(s.powerHp) })} />
          <StatRow
            label={t('modelLineup.labelTorque')}
            value={t('modelLineup.torque', { value: Math.round(s.torqueNm), rpm: Math.round(s.torqueRpm) })}
          />
          <StatRow
            label={t('modelLineup.labelEngineVolume')}
            value={t('modelLineup.engineVolume', { value: model.engine.displacementLiters.toFixed(1) })}
          />
          <StatRow
            label={t('modelLineup.labelFuelConsumption')}
            value={t('modelLineup.fuelConsumption', { value: s.fuelConsumptionL100Km.toFixed(1) })}
          />
          <StatRow
            label={t('modelLineup.labelReliability')}
            value={t('modelLineup.reliability', { value: Math.round(s.reliabilityPercent) })}
          />
          <StatRow label={t('modelLineup.labelEmissions')} value={t('modelLineup.emissions', { value: Math.round(s.emissionsGKm) })} />
          <StatRow label={t('modelLineup.labelRepairCost')} value={plainCurrency(s.repairCost)} />
          <StatRow label={t('modelLineup.labelWeight')} value={t('modelLineup.weight', { value: Math.round(s.weightKg) })} />
          <StatRow label={t('modelLineup.labelMaxRpm')} value={`${Math.round(s.maxRpm)}`} />
          <StatRow
            label={t('modelLineup.labelZeroToHundred')}
            value={t('modelLineup.zeroToHundred', { value: s.zeroToHundredSec.toFixed(1) })}
          />
        </div>
        <div className={styles.column}>
          <StatRow label={t('modelLineup.labelRating')} value={String(s.rating)} />
          <StatRow label={t('modelLineup.labelCarsSold')} value={grouped(model.totalSold)} />
          <StatRow label={t('modelLineup.labelEarnings')} value={fmt.compact(model.lifetimeEarnings)} />
          <StatRow label={t('modelLineup.labelYearOfIssue')} value={fmt.date(model.issueDate)} />
          <StatRow label={t('modelLineup.labelCostPrice')} value={plainCurrency(model.unitCost)} />
          <StatRow label={t('modelLineup.labelPrice')} value={plainCurrency(model.salePrice)} />
        </div>
      </div>

      <Button
        onClick={() => {
          beginRestyling(model.id)
          show('BodySelection')
        }}
      >
        {t('modelLineup.createRestyling')}
      </Button>
    </div>
  )
}
