import type { ReactNode } from 'react'
import styles from './ProgressButton.module.css'

interface ProgressButtonProps {
  label: string
  icon?: ReactNode
  /** 0-1 fraction of this category researched - shown as the bar under the label. */
  progress01: number
  active: boolean
  onClick: () => void
}

/** A category tab for the Research screen's left-hand list: icon, name and a progress bar showing
 * how much of the category is researched. The active tab is a bright card with a pointed right
 * edge, like the reference. */
export function ProgressButton({ label, icon, progress01, active, onClick }: ProgressButtonProps) {
  const clamped = Math.min(1, Math.max(0, progress01))
  return (
    <button type="button" className={`${styles.button} ${active ? styles.active : ''}`} onClick={onClick} aria-pressed={active}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.track}>
          <span className={styles.fill} style={{ transform: `scaleX(${clamped})` }} />
        </span>
      </span>
    </button>
  )
}
