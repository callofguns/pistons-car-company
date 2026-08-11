import styles from './StatRow.module.css'

interface StatRowProps {
  label: string
  value: string
  /** Signed percent delta badge, e.g. +2 or -5. Omit to hide the badge. */
  delta?: number
  locked?: boolean
}

/** Label + value row, the most reused element in the app (spec sheets, stat cards, company panel). Direct port of StatRowView.cs. */
export function StatRow({ label, value, delta, locked }: StatRowProps) {
  return (
    <div className={`${styles.row} ${locked ? styles.locked : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {delta !== undefined && delta !== 0 && (
        <span className={`${styles.delta} ${delta > 0 ? styles.positive : styles.negative}`}>
          {delta > 0 ? '+' : ''}
          {Math.round(delta)}%
        </span>
      )}
    </div>
  )
}
