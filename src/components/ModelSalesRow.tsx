import { ChevronRight } from 'lucide-react'
import type { CarModel } from '../core/vehicles'
import { isInDevelopment } from '../core/development'
import { useT } from '../i18n/useT'
import styles from './ModelSalesRow.module.css'

interface ModelSalesRowProps {
  model: CarModel
  onClick: () => void
}

/** One row of the Office Hub's SALES panel - the whole row is the button. Direct port of ModelSalesRowView.cs. */
export function ModelSalesRow({ model, onClick }: ModelSalesRowProps) {
  const { t, fmt } = useT()
  const developing = isInDevelopment(model)
  return (
    <button className={styles.row} onClick={onClick} aria-label={t('common.viewModelSales', { modelName: model.name })}>
      <span className={styles.name}>{model.name}</span>
      <span className={`${styles.today} ${developing ? styles.developing : ''}`}>
        {developing
          ? t('development.daysShort', { days: model.developmentDaysRemaining ?? 0 })
          : `+${model.lastDayUnitsSold} ${t('officeHub.soldToday')}`}
      </span>
      <span className={styles.earnings}>{fmt.money(model.lifetimeEarnings)}</span>
      <ChevronRight size={16} className={styles.chevron} />
    </button>
  )
}
