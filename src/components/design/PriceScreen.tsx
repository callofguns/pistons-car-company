import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { Banknote } from 'lucide-react'
import { plainCurrency } from '../../core/numberFormat'
import { useT } from '../../i18n/useT'
import { Button } from '../Primitives'
import styles from './PriceScreen.module.css'

interface PriceScreenProps {
  costPrice: number
  price: number
  onPrice: (price: number) => void
  /** What buyers pay on average for cars like this (shown once there is a sales department). */
  marketPrice: number | null
  onConfirm: () => void
  onBack: () => void
  tutorial?: React.ReactNode
}

/** The price step: the screen is split in two, the price on the blue side and the cost to build on
 * the grey side, and the slider moves the split. */
export function PriceScreen({ costPrice, price, onPrice, marketPrice, onConfirm, onBack, tutorial }: PriceScreenProps) {
  const { t } = useT()
  const min = Math.max(1, Math.round(costPrice))
  const max = Math.max(min + 10, Math.round(costPrice * 4))
  const position = (price - min) / (max - min)
  const split = 30 + position * 40
  const nudge = (delta: number) => onPrice(Math.min(max, Math.max(min, price + delta)))
  const step = Math.max(10, Math.round((max - min) / 100 / 10) * 10)

  return (
    <div className={styles.screen}>
      {tutorial && <div className={styles.tutorial}>{tutorial}</div>}
      <div className={styles.blue} style={{ width: `${split}%` }} />
      <div className={styles.grey} style={{ left: `${split}%` }} />
      <span className={`${styles.watermark} ${styles.watermarkLeft}`} style={{ right: `${100 - split + 1}%` }}>{t('priceScreen.release')}</span>
      <span className={`${styles.watermark} ${styles.watermarkRight}`} style={{ left: `${split + 1}%` }}>{t('priceScreen.production')}</span>

      <div className={styles.left} style={{ width: `${split - 2}%` }}>
        <span className={styles.label}>{t('priceScreen.price')}</span>
        <span className={styles.value}>
          <Banknote size={34} />
          {plainCurrency(price)}
        </span>
        <div className={`${styles.box} ${marketPrice === null ? styles.locked : ''}`}>
          <span>{t('priceScreen.marketPrice')}</span>
          {marketPrice === null ? (
            <b>
              <Lock size={14} /> {t('priceScreen.salesRequired')}
            </b>
          ) : (
            <b>
              <Banknote size={14} /> {plainCurrency(marketPrice)}
            </b>
          )}
        </div>
      </div>

      <div className={styles.right} style={{ left: `${split + 2}%` }}>
        <span className={styles.label}>{t('priceScreen.costPrice')}</span>
        <span className={styles.value}>
          <Banknote size={34} />
          {plainCurrency(costPrice)}
        </span>
        <div className={styles.box}>
          <span>{t('priceScreen.earnings')}</span>
          <b className={price - costPrice < 0 ? styles.loss : ''}>
            <Banknote size={14} /> {plainCurrency(price - costPrice)}
          </b>
        </div>
      </div>

      <div className={styles.sliderZone}>
        <button type="button" className={styles.chevron} style={{ left: `calc(${split}% - 56px)` }} onClick={() => nudge(-step)} aria-label="-">
          <ChevronLeft size={22} />
        </button>
        <button type="button" className={styles.chevron} style={{ left: `calc(${split}% + 32px)` }} onClick={() => nudge(step)} aria-label="+">
          <ChevronRight size={22} />
        </button>
        <input
          className={styles.slider}
          type="range"
          min={min}
          max={max}
          step={10}
          value={price}
          onChange={(e) => onPrice(Number(e.target.value))}
          aria-label={t('priceScreen.price')}
        />
      </div>

      <div className={styles.buttons}>
        <Button variant="primary" className={styles.confirm} onClick={onConfirm} data-tutorial-target="wizard-continue">
          {t('priceScreen.confirm')}
        </Button>
        <Button className={styles.back} onClick={onBack}>
          {t('priceScreen.back')}
        </Button>
      </div>
      <p className={styles.hint}>{t('priceScreen.hint')}</p>
    </div>
  )
}
