import type { ReactNode } from 'react'
import { useT } from '../i18n/useT'
import { Button } from './Primitives'
import styles from './CarCarousel.module.css'

interface CarCarouselProps {
  indexOneBased: number
  total: number
  onPrevious: () => void
  onNext: () => void
  /** Placeholder preview content - a colored box for now (no art yet), e.g. an emoji or the model's initial. */
  children?: ReactNode
}

/** The "< picture >" + "n / m" carousel used in Body Selection, Model Lineup, and Sales Statistics. Direct port of CarCarouselView.cs - owns only navigation chrome. */
export function CarCarousel({ indexOneBased, total, onPrevious, onNext, children }: CarCarouselProps) {
  const { t } = useT()
  return (
    <div className={styles.wrap}>
      <Button className={styles.arrow} onClick={onPrevious} disabled={indexOneBased <= 1} aria-label={t('common.previous')}>
        ‹
      </Button>
      <div className={styles.previewArea}>
        <div className={styles.previewBox}>{children ?? '🚗'}</div>
        <span className={styles.index}>
          {indexOneBased} / {total}
        </span>
      </div>
      <Button className={styles.arrow} onClick={onNext} disabled={indexOneBased >= total} aria-label={t('common.next')}>
        ›
      </Button>
    </div>
  )
}
