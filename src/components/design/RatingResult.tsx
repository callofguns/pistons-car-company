import { Star } from 'lucide-react'
import { AdvisorPanel } from '../AdvisorPanel'
import styles from './RatingResult.module.css'

interface RatingResultProps {
  title: string
  value0to5: number
  advisorName: string
  message: string
}

/** The reference's full-bleed "SAFETY RATING 3.2/5" result screen - a row of stars that fill
 * proportionally, the score, and advisor feedback. */
export function RatingResult({ title, value0to5, advisorName, message }: RatingResultProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.title}>{title}</span>
      <div className={styles.stars} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.min(1, Math.max(0, value0to5 - i))
          return (
            <span key={i} className={styles.star}>
              <Star size={36} className={styles.starEmpty} />
              <span className={styles.starFill} style={{ width: `${fill * 100}%` }}>
                <Star size={36} fill="currentColor" />
              </span>
            </span>
          )
        })}
      </div>
      <span className={styles.score}>{value0to5.toFixed(1)} / 5</span>
      <AdvisorPanel name={advisorName} message={message} />
    </div>
  )
}
