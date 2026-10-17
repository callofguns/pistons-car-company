import { plainCurrency } from '../../core/numberFormat'
import { useT } from '../../i18n/useT'
import styles from './PriceSlider.module.css'

interface PriceSliderProps {
  costPrice: number
  price: number
  onChange: (price: number) => void
}

/** The reference's price-vs-cost-price slider with live per-unit earnings, stacked for the design
 * wizard's narrow right-hand column. */
export function PriceSlider({ costPrice, price, onChange }: PriceSliderProps) {
  const { t } = useT()
  const min = Math.max(1, Math.round(costPrice))
  const max = Math.max(min + 1, Math.round(costPrice * 4))
  const earnings = price - costPrice

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{t('priceSlider.price')}</span>
      <span className={styles.value}>{plainCurrency(price)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={price}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
        aria-label={t('priceSlider.price')}
      />
      <div className={styles.row}>
        <span className={styles.label}>{t('priceSlider.costPrice')}</span>
        <span>{plainCurrency(costPrice)}</span>
      </div>
      <span className={`${styles.earnings} ${earnings < 0 ? styles.loss : ''}`}>{t('priceSlider.earnings', { value: plainCurrency(earnings) })}</span>
    </div>
  )
}
