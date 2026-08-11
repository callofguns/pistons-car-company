import styles from './AdvisorPanel.module.css'

interface AdvisorPanelProps {
  name: string
  message: string
}

/** The advisor portrait + name + message panel shown on Sales Statistics and Employees. Direct port of AdvisorPanelView.cs. Portrait is a placeholder circle for now. */
export function AdvisorPanel({ name, message }: AdvisorPanelProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.portrait}>🧑‍💼</div>
      <div>
        <p className={styles.name}>{name}</p>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
