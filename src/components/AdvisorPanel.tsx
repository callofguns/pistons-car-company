import { UserRound } from 'lucide-react'
import styles from './AdvisorPanel.module.css'

interface AdvisorPanelProps {
  name: string
  message: string
}

/** The advisor portrait + name + message panel shown on Sales Statistics, Employees and the Safety
 * Rating step. Direct port of AdvisorPanelView.cs. */
export function AdvisorPanel({ name, message }: AdvisorPanelProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.portrait} aria-hidden="true">
        <UserRound size={34} strokeWidth={1.8} />
      </div>
      <div>
        <p className={styles.name}>{name}</p>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
