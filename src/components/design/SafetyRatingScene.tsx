import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { CarArt, BARE_METAL } from '../../art/CarArt'
import { EngineerAvatar } from '../../art/EngineerAvatar'
import { FactoryBackdrop } from '../../art/FactoryBackdrop'
import { Button } from '../Primitives'
import { useT } from '../../i18n/useT'
import styles from './SafetyRatingScene.module.css'

interface SafetyRatingSceneProps {
  bodyId: string
  convertible?: boolean
  stars: number
  advice: string
  onContinue: () => void
  /** The tutorial card, when the guided tour is on. */
  tutorial?: ReactNode
}

/** The full-screen crash-test result: a big score behind the car, the engineer's advice at the
 * bottom left and CONTINUE at the bottom right. */
export function SafetyRatingScene({ bodyId, convertible, stars, advice, onContinue, tutorial }: SafetyRatingSceneProps) {
  const { t } = useT()
  return (
    <div className={styles.scene}>
      <FactoryBackdrop className={styles.backdrop} />
      {tutorial && <div className={styles.tutorial}>{tutorial}</div>}

      <div className={styles.heading}>
        <svg className={styles.dummy} viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#111" />
          <path d="M16 1 A15 15 0 0 1 31 16 H16 Z" fill="#f6c431" />
          <path d="M16 31 A15 15 0 0 1 1 16 H16 Z" fill="#f6c431" />
        </svg>
        <span className={styles.title}>{t('carDesign.safetyRatingTitle')}</span>
      </div>

      <span className={styles.score} aria-label={`${stars.toFixed(1)} / 5`}>
        {stars.toFixed(1)}
        <span className={styles.outOf}>/5</span>
      </span>

      <CarArt bodyId={bodyId} color={BARE_METAL} variant="bare" convertible={convertible} className={styles.car} />

      <div className={styles.engineer}>
        <EngineerAvatar />
      </div>
      <div className={styles.advice}>
        <b>{t('carDesign.engineerAdvisor')}</b>
        <span>{advice}</span>
      </div>

      <Button variant="primary" className={styles.continue} onClick={onContinue}>
        <Check size={18} />
        {t('common.continue').replace('✓ ', '')}
      </Button>
    </div>
  )
}
