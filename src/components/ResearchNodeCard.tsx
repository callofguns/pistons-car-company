import type { ResearchNodeDefinition, ResearchNodeState } from '../core/research'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button } from './Primitives'
import { MeterBar } from './MeterBar'
import styles from './ResearchNodeCard.module.css'

interface ResearchNodeCardProps {
  node: ResearchNodeDefinition
  state: ResearchNodeState
  progress01: number
  moneyCost: number
  onAction: () => void
}

const STATE_LABEL_KEY: Record<ResearchNodeState, MessageKey> = {
  Locked: 'research.state.Locked',
  AvailableNormal: 'research.state.AvailableNormal',
  AvailableBreakthrough: 'research.state.AvailableBreakthrough',
  InProgress: 'research.state.InProgress',
  Researched: 'research.state.Researched',
}

/** One tech-tree card. Action button label/color follow ResearchNodeState. Direct port of ResearchNodeCardView.cs. */
export function ResearchNodeCard({ node, state, progress01, moneyCost, onAction }: ResearchNodeCardProps) {
  const { t, fmt } = useT()
  const interactable = state === 'AvailableNormal' || state === 'AvailableBreakthrough'
  const variant = state === 'AvailableBreakthrough' ? 'danger' : state === 'Researched' ? 'primary' : 'ghost'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span>{node.availableYear}</span>
        {(state === 'AvailableBreakthrough' || state === 'InProgress') && <span className={styles.warning}>⚠</span>}
      </div>
      <MeterBar value01={progress01} />
      <div className={styles.name}>{t(`data.research.${node.id}.name` as MessageKey)}</div>
      <div className={styles.costRow}>
        <span className={styles.science}>🧪 {node.scienceCost}</span>
        <span className={styles.money}>{fmt.compact(moneyCost)}</span>
      </div>
      <Button variant={variant} disabled={!interactable} onClick={onAction}>
        {t(STATE_LABEL_KEY[state])}
      </Button>
    </div>
  )
}
