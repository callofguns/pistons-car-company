import type { ComponentSlot } from '../../data/designSteps'
import { plainCurrency } from '../../core/numberFormat'
import { Button } from '../Primitives'
import styles from './ComponentSlotCard.module.css'

interface ComponentSlotCardProps {
  slot: ComponentSlot
  selectedOptionId: string | undefined
  /** Options past the current in-game year are excluded from cycling - only the nearest one is
   * hinted at, matching the reference's "locked until year X" cards without needing a separate
   * locked-preview interaction for this pass. */
  currentYear: number
  onSelect: (optionId: string) => void
}

/** One cycling option picker - the reference's right-hand "Airbags: NONE ‹1/1›" style cards. */
export function ComponentSlotCard({ slot, selectedOptionId, currentYear, onSelect }: ComponentSlotCardProps) {
  const unlocked = slot.options.filter((o) => o.unlockYear <= currentYear)
  const locked = slot.options.filter((o) => o.unlockYear > currentYear).sort((a, b) => a.unlockYear - b.unlockYear)

  if (unlocked.length === 0) return null // shouldn't happen - every slot's first option unlocks at 1950

  const index = Math.max(0, unlocked.findIndex((o) => o.id === selectedOptionId))
  const option = unlocked[index]
  const nextLocked = locked[0]

  return (
    <div className={styles.card}>
      <span className={styles.label}>{slot.label}</span>
      <div className={styles.cycler}>
        <Button
          className={styles.arrow}
          onClick={() => onSelect(unlocked[Math.max(0, index - 1)].id)}
          disabled={index <= 0}
          aria-label={`Previous ${slot.label}`}
        >
          ‹
        </Button>
        <div className={styles.optionInfo}>
          <span className={styles.optionName}>{option.label.toUpperCase()}</span>
          <span className={styles.index}>
            {index + 1}/{unlocked.length}
          </span>
        </div>
        <Button
          className={styles.arrow}
          onClick={() => onSelect(unlocked[Math.min(unlocked.length - 1, index + 1)].id)}
          disabled={index >= unlocked.length - 1}
          aria-label={`Next ${slot.label}`}
        >
          ›
        </Button>
      </div>
      {option.description && <span className={styles.description}>{option.description}</span>}
      {option.costDelta !== 0 && (
        <span className={styles.costDelta}>
          {option.costDelta > 0 ? '+' : ''}
          {plainCurrency(option.costDelta)}
        </span>
      )}
      {nextLocked && (
        <span className={styles.lockedHint}>
          🔒 {nextLocked.label} unlocks {nextLocked.unlockYear}
        </span>
      )}
    </div>
  )
}
