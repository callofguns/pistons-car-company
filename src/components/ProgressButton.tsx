import styles from './ProgressButton.module.css'

interface ProgressButtonProps {
  label: string
  /** 0-1 fraction of this category researched - fills the button like a loading bar as it climbs. */
  progress01: number
  active: boolean
  onClick: () => void
}

/** A category-tab button whose own background fills up with research progress, instead of a
 * separate button + MeterBar pair stacked on top of each other - used by the Research screen's
 * left-hand category list. */
export function ProgressButton({ label, progress01, active, onClick }: ProgressButtonProps) {
  const clamped = Math.min(1, Math.max(0, progress01))
  return (
    <button type="button" className={`${styles.button} ${active ? styles.active : ''}`} onClick={onClick}>
      <span className={styles.fill} style={{ transform: `scaleX(${clamped})` }} />
      <span className={styles.label}>{label}</span>
    </button>
  )
}
