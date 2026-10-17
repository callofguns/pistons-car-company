import { useEffect, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { grouped } from '../core/numberFormat'
import { carsOnOrder } from '../core/factory'
import { freshness, modelAgeYears } from '../core/aging'
import { isInDevelopment } from '../core/development'
import { useT } from '../i18n/useT'
import { CarCarousel } from '../components/CarCarousel'
import { AdvisorPanel } from '../components/AdvisorPanel'
import { StatRow } from '../components/StatRow'
import { MeterBar } from '../components/MeterBar'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** Per-model sell-through dashboard: advisor panel, stat list, daily-sales radial, withdraw/marketing actions. */
export function SalesStatisticsScreen() {
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const factory = useGameStore((s) => s.world.factory)
  const today = useGameStore((s) => s.world.time.currentDate)
  const setOnSale = useGameStore((s) => s.setOnSale)
  const { t, tp, fmt } = useT()

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

  if (models.length === 0) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>{t('salesStats.noModels')}</span>
      </div>
    )
  }

  const model = models[Math.min(index, models.length - 1)]
  const onOrder = carsOnOrder(factory, model.id)
  const fresh = isInDevelopment(model) ? 1 : freshness(model, today)
  const ageYears = isInDevelopment(model) ? 0 : modelAgeYears(model, today)

  return (
    <div className={`${styles.screen} ${styles.columns}`}>
      <div className={styles.column}>
        {/* Ben Gross is a proper noun, not translated - see EmployeesScreen for the same rule. */}
        <AdvisorPanel name="Ben Gross" message={fresh < 0.8 ? t('salesStats.advisorOld') : t('salesStats.advisorMessage')} />
        <CarCarousel
          model={model}
          indexOneBased={index + 1}
          total={models.length}
          onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => Math.min(models.length - 1, i + 1))}
        />
        <Heading style={{ textAlign: 'center' }}>{model.name}</Heading>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <MeterBar
            radial
            value01={model.currentDailySalesRatePercent / 100}
            displayValue={t('salesStats.dailySalesRate', { value: Math.round(model.currentDailySalesRatePercent) })}
          />
          <span>{tp('stats.unitsSoldToday', model.lastDayUnitsSold)}</span>
        </div>
      </div>

      <div className={`${styles.column} ${styles.card}`}>
        <StatRow label={t('salesStats.labelTotalSold')} value={grouped(model.totalSold)} />
        <StatRow label={t('salesStats.labelFreshness')} value={t('salesStats.freshnessValue', { percent: Math.round(fresh * 100), years: ageYears.toFixed(1) })} />
        <StatRow label={t('salesStats.labelInStock')} value={grouped(model.inventory)} />
        <StatRow label={t('salesStats.labelOnOrder')} value={grouped(onOrder)} />
        <StatRow label={t('salesStats.labelSalesIncome')} value={fmt.money(model.lastDayRevenue)} />
        <StatRow label={t('salesStats.labelEarnings')} value={fmt.money(model.lifetimeEarnings)} />
        <StatRow
          label={t('salesStats.labelMarketingDuration')}
          value={model.marketingActive ? tp('stats.marketingDaysRemaining', model.marketingDaysRemaining) : t('salesStats.marketingInactive')}
        />
        <StatRow
          label={t('salesStats.labelMarketingEfficiency')}
          value={
            model.marketingActive
              ? t('salesStats.efficiencyMultiplier', { value: model.marketingEfficiencyMultiplier.toFixed(1) })
              : t('salesStats.efficiencyDefault')
          }
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
          <Button style={{ flex: 1 }} onClick={() => setOnSale(model.id, !model.isOnSale)}>
            {model.isOnSale ? t('salesStats.withdraw') : t('salesStats.resume')}
          </Button>
          <Button
            variant="primary"
            style={{ flex: 1 }}
            disabled={model.marketingActive}
            onClick={() => show('Promotion', model.id)}
          >
            {t('salesStats.launchMarketing')}
          </Button>
        </div>
      </div>
    </div>
  )
}
