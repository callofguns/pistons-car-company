import { AdvisorPanel } from '../AdvisorPanel'
import styles from './RatingResult.module.css'

interface RatingResultProps {
  title: string
  value0to5: number
  advisorName: string
  message: string
}

/** The reference's full-bleed "SAFETY RATING 3.2/5" result screen with advisor feedback. */
export function RatingResult({ title, value0to5, advisorName, message }: RatingResultProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.title}>{title}</span>
      <span className={styles.score}>{value0to5.toFixed(1)} / 5</span>
      <AdvisorPanel name={advisorName} message={message} />
    </div>
  )
}
