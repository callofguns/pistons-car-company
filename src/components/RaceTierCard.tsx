import type { RaceTierDefinition } from '../core/racing'
import { findClassificationTag } from '../data/classifications'
import { useT } from '../i18n/useT'
import { Button } from './Primitives'
import styles from './RaceTierCard.module.css'

interface RaceTierCardProps {
  tier: RaceTierDefinition
  unlocked: boolean
  onSelect: () => void
}

/** One race tier card on the "ENTER A RACE" screen - structural clone of PromotionTierCard. */
export function RaceTierCard({ tier, unlocked, onSelect }: RaceTierCardProps) {
  const { t, fmt } = useT()
  const preferredTag = tier.preferredTagId ? findClassificationTag(tier.preferredTagId) : undefined

  return (
    <div className={styles.card}>
      <div className={styles.title}>{t(tier.displayNameKey)}</div>
      <div className={styles.row}>
        <span>{t('race.entryFee')}</span>
        <span>{fmt.compact(tier.entryFee)}</span>
      </div>
      <div className={styles.row}>
        <span>{t('race.firstPrize')}</span>
        <span className={styles.prize}>{fmt.compact(tier.firstPrize)}</span>
      </div>
      <div className={styles.row}>
        <span>{t('race.fieldSize')}</span>
        <span>{tier.fieldSize}</span>
      </div>
      {preferredTag && <span className={styles.favors}>{t('race.favorsType', { type: t(preferredTag.labelKey) })}</span>}
      <Button variant="primary" className={styles.selectButton} disabled={!unlocked} onClick={onSelect}>
        {t('race.confirm')}
      </Button>
      {!unlocked && (
        <div className={styles.overlay}>
          <span>🔒</span>
          <span>{t('promotion.unlocksInYears', { year: tier.unlockYear })}</span>
        </div>
      )}
    </div>
  )
}
