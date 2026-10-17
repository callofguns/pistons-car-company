import type { ReactNode } from 'react'
import styles from './HudPill.module.css'

interface HudPillProps {
  icon?: ReactNode
  value: string
  /** Read by screen readers and shown as a hover tooltip - the icon alone doesn't say what the number is. */
  label: string
  tone?: 'normal' | 'danger'
  className?: string
}

/** One icon+value box in the top HUD bar. Direct port of HudPillView.cs. */
export function HudPill({ icon, value, label, tone = 'normal', className }: HudPillProps) {
  return (
    <div className={`${styles.pill} ${tone === 'danger' ? styles.danger : ''} ${className ?? ''}`} title={label} aria-label={`${label}: ${value}`}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.value}>{value}</span>
    </div>
  )
}
