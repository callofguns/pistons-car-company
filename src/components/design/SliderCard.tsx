import { Info, Minus, Plus } from 'lucide-react'
import styles from './SliderCard.module.css'

interface SliderCardProps {
  label: string
  /** The number shown at the right, already formatted ("4000 RPM"). */
  valueText: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

/** A number picked with a slider and - / + buttons, like the reference's Rpm limit and Fuel
 * mixture rows. */
export function SliderCard({ label, valueText, value, min, max, step = 1, onChange }: SliderCardProps) {
  const bump = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)))
  return (
    <div className={styles.card}>
      <span className={styles.info}>
        <Info size={13} strokeWidth={2.5} />
      </span>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{valueText}</span>
      </div>
      <div className={styles.row}>
        <button type="button" className={styles.step} onClick={() => bump(-step)} aria-label={`${label} -`}>
          <Minus size={16} strokeWidth={3} />
        </button>
        <input
          className={styles.range}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
        <button type="button" className={styles.step} onClick={() => bump(step)} aria-label={`${label} +`}>
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}
