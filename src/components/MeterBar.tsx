import styles from './MeterBar.module.css'

interface MeterBarProps {
  value01: number
  displayValue?: string
  radial?: boolean
}

/** A labeled fill meter - research category progress, staff XP bar, the circular "Current daily sales" badge. Direct port of MeterBarView.cs. */
export function MeterBar({ value01, displayValue, radial }: MeterBarProps) {
  const clamped = Math.min(1, Math.max(0, value01))

  if (radial) {
    return (
      <div
        className={`${styles.track} ${styles.radial}`}
        style={{
          background: `conic-gradient(var(--color-blue) ${clamped * 360}deg, var(--color-panel-dark) 0deg)`,
        }}
      >
        <span className={styles.value}>{displayValue}</span>
      </div>
    )
  }

  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ transform: `scaleX(${clamped})` }} />
      {displayValue && <span className={styles.value}>{displayValue}</span>}
    </div>
  )
}
