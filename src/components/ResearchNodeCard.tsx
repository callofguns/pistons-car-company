import type { ResearchNodeDefinition, ResearchNodeState } from '../core/research'
import { compact } from '../core/numberFormat'
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

const STATE_LABEL: Record<ResearchNodeState, string> = {
  Locked: 'LOCKED',
  AvailableNormal: 'RESEARCH',
  AvailableBreakthrough: 'BREAKTHROUGH',
  InProgress: 'RESEARCHING…',
  Researched: 'RESEARCHED',
}

/** One tech-tree card. Action button label/color follow ResearchNodeState. Direct port of ResearchNodeCardView.cs. */
export function ResearchNodeCard({ node, state, progress01, moneyCost, onAction }: ResearchNodeCardProps) {
  const interactable = state === 'AvailableNormal' || state === 'AvailableBreakthrough'
  const variant = state === 'AvailableBreakthrough' ? 'danger' : state === 'Researched' ? 'primary' : 'ghost'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span>{node.availableYear}</span>
        {(state === 'AvailableBreakthrough' || state === 'InProgress') && <span className={styles.warning}>⚠</span>}
      </div>
      <MeterBar value01={progress01} />
      <div className={styles.name}>{node.displayName}</div>
      <div className={styles.costRow}>
        <span className={styles.science}>🧪 {node.scienceCost}</span>
        <span className={styles.money}>{compact(moneyCost)}</span>
      </div>
      <Button variant={variant} disabled={!interactable} onClick={onAction}>
        {STATE_LABEL[state]}
      </Button>
    </div>
  )
}
