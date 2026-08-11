import { useEffect, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { grouped, compact } from '../core/numberFormat'
import { CarCarousel } from '../components/CarCarousel'
import { AdvisorPanel } from '../components/AdvisorPanel'
import { StatRow } from '../components/StatRow'
import { MeterBar } from '../components/MeterBar'
import { Button } from '../components/Primitives'
import styles from './screen.module.css'

/** Per-model sell-through dashboard: advisor panel, stat list, daily-sales radial, withdraw/marketing actions. */
export function SalesStatisticsScreen() {
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const setOnSale = useGameStore((s) => s.setOnSale)

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
        <span className={styles.empty}>No models to report on yet.</span>
      </div>
    )
  }

  const model = models[Math.min(index, models.length - 1)]
  const leftToSell = Math.max(0, model.plannedProductionRun - model.totalSold)

  return (
    <div className={styles.screen}>
      <AdvisorPanel name="Ben Gross" message="Boss! Here is the sales statistics of the current model" />
      <CarCarousel
        indexOneBased={index + 1}
        total={models.length}
        onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(models.length - 1, i + 1))}
      />

      <StatRow label="Total sold" value={`${grouped(model.totalSold)} / ${grouped(model.plannedProductionRun)}`} />
      <StatRow label="Models left to sell" value={grouped(leftToSell)} />
      <StatRow label="Sales income" value={compact(model.lastDayRevenue)} />
      <StatRow label="Earnings" value={compact(model.lifetimeEarnings)} />
      <StatRow label="Marketing duration" value={model.marketingActive ? `${model.marketingDaysRemaining} Days` : '-'} />
      <StatRow label="Marketing efficiency" value={model.marketingActive ? `x${model.marketingEfficiencyMultiplier.toFixed(1)}` : 'x1'} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <MeterBar radial value01={model.currentDailySalesRatePercent / 100} displayValue={`${Math.round(model.currentDailySalesRatePercent)}%`} />
        <span>{model.lastDayUnitsSold} units today</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button style={{ flex: 1 }} onClick={() => setOnSale(model.id, !model.isOnSale)}>
          {model.isOnSale ? 'WITHDRAW FROM SALE' : 'RESUME SALE'}
        </Button>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          disabled={model.marketingActive}
          onClick={() => show('Promotion', model.id)}
        >
          LAUNCH MARKETING
        </Button>
      </div>
    </div>
  )
}
