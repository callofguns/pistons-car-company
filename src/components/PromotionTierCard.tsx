import { PROMOTION_CHANNELS, type PromotionTierDefinition } from '../core/marketing'
import { compact } from '../core/numberFormat'
import { Button } from './Primitives'
import styles from './PromotionTierCard.module.css'

interface PromotionTierCardProps {
  tier: PromotionTierDefinition
  unlocked: boolean
  onSelect: () => void
}

const CHANNEL_LABEL: Record<string, string> = {
  Press: 'Press',
  Radio: 'Radio',
  BillboardsAndStands: 'Billboards & stands',
  TV: 'TV',
  Internet: 'Internet',
  Cinemas: 'Cinemas',
}

/** One Basic/Medium/Large promotion tier card. Channel rows past unlockedChannelCount render dimmed. Direct port of PromotionTierCardView.cs. */
export function PromotionTierCard({ tier, unlocked, onSelect }: PromotionTierCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{tier.displayName.toUpperCase()}</div>
      {PROMOTION_CHANNELS.map((channel, i) => (
        <div key={channel} className={`${styles.channel} ${i >= tier.unlockedChannelCount ? styles.channelDim : ''}`}>
          <span>•</span>
          <span>{CHANNEL_LABEL[channel]}</span>
        </div>
      ))}
      <div className={styles.cost}>{compact(tier.cost)}</div>
      <Button variant="primary" disabled={!unlocked} onClick={onSelect}>
        SELECT
      </Button>
      {!unlocked && (
        <div className={styles.overlay}>
          <span>🔒</span>
          <span>{tier.unlockYear} y.</span>
        </div>
      )}
    </div>
  )
}
