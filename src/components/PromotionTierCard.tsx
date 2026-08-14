import { PROMOTION_CHANNELS, type PromotionTierDefinition } from '../core/marketing'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button } from './Primitives'
import styles from './PromotionTierCard.module.css'

interface PromotionTierCardProps {
  tier: PromotionTierDefinition
  unlocked: boolean
  onSelect: () => void
}

const CHANNEL_LABEL_KEY: Record<string, MessageKey> = {
  Press: 'data.promoChannel.Press',
  Radio: 'data.promoChannel.Radio',
  BillboardsAndStands: 'data.promoChannel.BillboardsAndStands',
  TV: 'data.promoChannel.TV',
  Internet: 'data.promoChannel.Internet',
  Cinemas: 'data.promoChannel.Cinemas',
}

/** One Basic/Medium/Large promotion tier card. Channel rows past unlockedChannelCount render dimmed. Direct port of PromotionTierCardView.cs. */
export function PromotionTierCard({ tier, unlocked, onSelect }: PromotionTierCardProps) {
  const { t, fmt } = useT()

  return (
    <div className={styles.card}>
      <div className={styles.title}>{tier.displayName}</div>
      {PROMOTION_CHANNELS.map((channel, i) => (
        <div key={channel} className={`${styles.channel} ${i >= tier.unlockedChannelCount ? styles.channelDim : ''}`}>
          <span>•</span>
          <span>{t(CHANNEL_LABEL_KEY[channel])}</span>
        </div>
      ))}
      <div className={styles.cost}>{fmt.compact(tier.cost)}</div>
      <Button variant="primary" disabled={!unlocked} onClick={onSelect}>
        {t('promotion.select')}
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
