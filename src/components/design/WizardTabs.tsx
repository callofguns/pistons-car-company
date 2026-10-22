import { Check } from 'lucide-react'
import styles from './WizardTabs.module.css'

interface WizardTabsProps {
  titles: string[]
  index: number
  /** The furthest step that can be jumped to right now (the next one, once this one is complete). */
  maxIndex: number
  onJump: (index: number) => void
}

/** The strip of step names along the top: the one before, this one, and the next two (the last
 * faded). Tap a finished one to go back, or the next one to carry on. */
export function WizardTabs({ titles, index, maxIndex, onJump }: WizardTabsProps) {
  const shown = [index - 1, index, index + 1, index + 2]
  return (
    <div className={styles.tabs}>
      {shown.map((i, slot) => {
        if (i < 0 || i >= titles.length) return <span key={`gap-${slot}`} />
        const current = i === index
        return (
          <button
            key={i}
            type="button"
            disabled={current || i > maxIndex}
            onClick={() => onJump(i)}
            className={`${styles.tab} ${current ? styles.active : ''} ${slot === 3 ? styles.faded : ''}`}
          >
            {i < index && <Check size={13} className={styles.check} />}
            <span>{titles[i]}</span>
          </button>
        )
      })}
    </div>
  )
}
