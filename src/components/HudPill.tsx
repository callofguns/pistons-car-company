import styles from './HudPill.module.css'

interface HudPillProps {
  icon: string
  value: string
}

/** One icon+text pill in the top HUD bar. Direct port of HudPillView.cs. */
export function HudPill({ icon, value }: HudPillProps) {
  return (
    <div className={styles.pill}>
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  )
}
