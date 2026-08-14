import { plainCurrency } from '../../core/numberFormat'
import { useT } from '../../i18n/useT'
import styles from './PriceSlider.module.css'

interface PriceSliderProps {
  costPrice: number
  price: number
  onChange: (price: number) => void
}

/** The reference's price-vs-cost-price slider with live per-unit earnings. */
export function PriceSlider({ costPrice, price, onChange }: PriceSliderProps) {
  const { t } = useT()
  const min = Math.max(1, Math.round(costPrice))
  const max = Math.max(min + 1, Math.round(costPrice * 4))
  const earnings = price - costPrice

  return (
    <div className={styles.wrap}>
      <div className={styles.side}>
        <span className={styles.label}>{t('priceSlider.price')}</span>
        <span className={styles.value}>{plainCurrency(price)}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={price}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />

      <div className={styles.side}>
        <span className={styles.label}>{t('priceSlider.costPrice')}</span>
        <span className={styles.value}>{plainCurrency(costPrice)}</span>
        <span className={styles.earnings}>{t('priceSlider.earnings', { value: plainCurrency(earnings) })}</span>
      </div>
    </div>
  )
}
