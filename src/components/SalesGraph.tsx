import type { CarModel } from '../core/vehicles'
import styles from './SalesGraph.module.css'

interface SalesGraphProps {
  models: CarModel[]
}

/** A small flat bar chart of each model's most recent daily sales, for the Office Hub's "current
 * models being sold" panel - "how many are being sold" reads as ongoing/recent activity, not
 * lifetime total, hence lastDayUnitsSold rather than totalSold. */
export function SalesGraph({ models }: SalesGraphProps) {
  const max = Math.max(1, ...models.map((m) => m.lastDayUnitsSold))

  return (
    <div className={styles.chart}>
      {models.map((model) => (
        <div key={model.id} className={styles.column}>
          <span className={styles.value}>{model.lastDayUnitsSold}</span>
          <div className={styles.track}>
            <div className={styles.bar} style={{ height: `${Math.max(2, (model.lastDayUnitsSold / max) * 100)}%` }} />
          </div>
          <span className={styles.label}>{model.name}</span>
        </div>
      ))}
    </div>
  )
}
