import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CarModel } from '../core/vehicles'
import { useT } from '../i18n/useT'
import { CarArt, modelPaint } from '../art/CarArt'
import { Button } from './Primitives'
import styles from './CarCarousel.module.css'

interface CarCarouselProps {
  indexOneBased: number
  total: number
  onPrevious: () => void
  onNext: () => void
  /** The model on show - drawn in its body style and (stable, id-derived) paint color. */
  model: CarModel
  /** Grow to fill the parent's height (showroom center column) instead of a fixed-size preview. */
  fill?: boolean
}

/** The "< car picture >" + "n / m" carousel used in Model Lineup, Sales Statistics, Promotion and
 * Race Entry. Direct port of CarCarouselView.cs - owns only navigation chrome. */
export function CarCarousel({ indexOneBased, total, onPrevious, onNext, model, fill }: CarCarouselProps) {
  const { t } = useT()
  return (
    <div className={`${styles.wrap} ${fill ? styles.fill : ''}`}>
      <Button className={styles.arrow} onClick={onPrevious} disabled={indexOneBased <= 1} aria-label={t('common.previous')}>
        <ChevronLeft size={24} />
      </Button>
      <div className={styles.previewArea}>
        <div className={styles.previewBox}>
          <CarArt bodyId={model.bodyStyleId} color={modelPaint(model.id)} className={styles.car} title={model.name} />
        </div>
        <span className={styles.index}>
          {indexOneBased} / {total}
        </span>
      </div>
      <Button className={styles.arrow} onClick={onNext} disabled={indexOneBased >= total} aria-label={t('common.next')}>
        <ChevronRight size={24} />
      </Button>
    </div>
  )
}
