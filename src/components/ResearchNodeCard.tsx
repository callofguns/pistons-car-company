import { useState, type ReactNode } from 'react'
import { FlaskConical, Info, TriangleAlert } from 'lucide-react'
import { BREAKTHROUGH_MAX_YEARS_EARLY, type ResearchNodeDefinition, type ResearchNodeState } from '../core/research'
import { researchNodeName } from '../i18n/research'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button } from './Primitives'
import styles from './ResearchNodeCard.module.css'

interface ResearchNodeCardProps {
  node: ResearchNodeDefinition
  state: ResearchNodeState
  progress01: number
  moneyCost: number
  scienceCost: number
  /** False when the company is short on research points or cash for this node right now. */
  affordable: boolean
  icon: ReactNode
  onAction: () => void
}

const STATE_LABEL_KEY: Record<ResearchNodeState, MessageKey> = {
  Locked: 'research.state.Locked',
  TooEarly: 'research.state.TooEarly',
  AvailableNormal: 'research.state.AvailableNormal',
  AvailableBreakthrough: 'research.state.AvailableBreakthrough',
  InProgress: 'research.state.InProgress',
  Researched: 'research.state.Researched',
}

/** One blueprint card in the tech tree, laid out like the reference: part icon, due year and
 * progress %, name, research-point + money cost, and an action button whose label/color follow
 * ResearchNodeState. The (i) button flips the card to show what the research actually does.
 * Direct port of ResearchNodeCardView.cs. */
export function ResearchNodeCard({ node, state, progress01, moneyCost, scienceCost, affordable, icon, onAction }: ResearchNodeCardProps) {
  const { t, fmt } = useT()
  const [showInfo, setShowInfo] = useState(false)
  // Was enabled even when unaffordable, so a tap silently did nothing.
  const interactable = (state === 'AvailableNormal' || state === 'AvailableBreakthrough') && affordable
  const variant = state === 'AvailableBreakthrough' ? 'danger' : state === 'AvailableNormal' ? 'primary' : 'secondary'
  const name = researchNodeName(node, t)
  const early = state === 'AvailableBreakthrough'
  const dim = state === 'Locked' || state === 'TooEarly'

  return (
    <div className={`${styles.card} ${dim ? styles.dim : ''} ${state === 'Researched' ? styles.done : ''}`}>
      <button className={styles.infoButton} onClick={() => setShowInfo((v) => !v)} aria-label={t('research.info', { name })} aria-pressed={showInfo}>
        <Info size={14} strokeWidth={2.5} />
      </button>

      <div className={styles.top}>
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
        <div className={styles.titleBlock}>
          <div className={styles.badges}>
            <span className={styles.year}>{node.availableYear}</span>
            <span className={styles.percent}>{Math.round(progress01 * 100)}%</span>
            {early && (
              <span className={styles.warning} title={t('research.earlyWarning', { year: node.availableYear })}>
                <TriangleAlert size={14} />
              </span>
            )}
          </div>
          <div className={styles.name}>{name}</div>
        </div>
      </div>

      {showInfo ? (
        <ul className={styles.effects}>
          {node.unlocks && <li>{t(`research.unlocks.${node.unlocks.kind}` as MessageKey)}</li>}
          {node.prerequisiteId && state === 'Locked' && <li>{t('research.needsPrevious')}</li>}
          {node.effects.map((effect) => (
            <li key={effect.target}>
              {t(`research.effect.${effect.target}` as MessageKey, {
                amount: `${effect.amount > 0 ? '+' : ''}${Math.round(effect.amount * 100)}%`,
              })}
            </li>
          ))}
          <li className={styles.duration}>{t('research.duration', { days: node.durationDays })}</li>
        </ul>
      ) : (
        <div className={styles.costRow}>
          <span className={styles.science}>
            <FlaskConical size={15} />
            {scienceCost}
          </span>
          <span className={styles.money}>{fmt.money(moneyCost)}</span>
        </div>
      )}

      {state === 'InProgress' && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ transform: `scaleX(${progress01})` }} />
        </div>
      )}

      <Button variant={variant} className={styles.action} disabled={!interactable} onClick={onAction}>
        {t(STATE_LABEL_KEY[state], { year: node.availableYear - BREAKTHROUGH_MAX_YEARS_EARLY })}
      </Button>
    </div>
  )
}
