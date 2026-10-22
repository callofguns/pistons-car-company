import type { ReactNode } from 'react'
import { Banknote } from 'lucide-react'
import { FactoryBackdrop } from '../../art/FactoryBackdrop'
import { PaintShopBackdrop, WindTunnelBackdrop } from '../../art/StudioBackdrops'
import { useT } from '../../i18n/useT'
import { plainCurrency } from '../../core/numberFormat'
import layout from '../../screens/showroom.module.css'
import styles from './StepFrame.module.css'

interface StepFrameProps {
  backdrop: 'factory' | 'paint' | 'tunnel'
  /** The left column: the spec sheet, or this step's own picker. */
  left?: ReactNode
  tabs: ReactNode
  costPrice?: number | null
  /** The car (and anything laid over it). */
  stage: ReactNode
  /** Meters under the car. */
  bottom?: ReactNode
  /** The CONTINUE button when it sits under the car; leave out to put it in the right column. */
  continueButton?: ReactNode
  /** The right column: this step's parts. */
  right: ReactNode
}

/** The frame every car-designer step shares: a backdrop, a left column, the middle (tabs, cost
 * price, the car, meters, CONTINUE) and a right column - like the reference. */
export function StepFrame({ backdrop, left, tabs, costPrice, stage, bottom, continueButton, right }: StepFrameProps) {
  const { t } = useT()
  const Backdrop = backdrop === 'paint' ? PaintShopBackdrop : backdrop === 'tunnel' ? WindTunnelBackdrop : FactoryBackdrop
  return (
    <div className={layout.page}>
      <Backdrop className={layout.backdrop} />
      <aside className={layout.side}>{left}</aside>
      <section className={`${layout.center} ${styles.center}`}>
        {tabs}
        <div className={styles.costPrice}>
          {costPrice != null && (
            <>
              <span className={styles.costLabel}>{t('carDesign.costPrice')}</span>
              <span className={styles.costValue}>
                <Banknote size={15} />
                {plainCurrency(costPrice)}
              </span>
            </>
          )}
        </div>
        <div className={styles.stage}>{stage}</div>
        {bottom && <div className={styles.bottom}>{bottom}</div>}
        {continueButton}
      </section>
      <aside className={layout.side}>{right}</aside>
    </div>
  )
}
