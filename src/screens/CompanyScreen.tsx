import { useGameStore } from '../store/useGameStore'
import { compact, percent } from '../core/numberFormat'
import { StatRow } from '../components/StatRow'
import { RumorRow } from '../components/RumorRow'
import { Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** Company overview: name/city, headline stats, and the Rumors feed. */
export function CompanyScreen() {
  useGameStore((s) => s.revision)
  const company = useGameStore((s) => s.world.company)
  const rumors = useGameStore((s) => s.world.rumors)

  return (
    <div className={styles.columnsPage}>
      <div className={`${styles.column} ${styles.columnMedium}`}>
        <div style={{ fontSize: '4rem', textAlign: 'center' }}>🐎</div>
        <Heading style={{ textAlign: 'center' }}>{company.companyName}</Heading>
        <span style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>{company.homeCity.toUpperCase()}</span>

        <StatRow label="Auto released" value={String(company.autoReleasedCount)} />
        <StatRow label="Total sold" value={compact(company.totalCarsSoldAllModels)} />
        <StatRow label="Market share" value={percent(company.marketSharePercent, 0)} />
        <StatRow label="Earned" value={compact(company.lifetimeEarnings)} />
      </div>

      <div className={styles.column}>
        <Heading style={{ fontSize: '1.1rem' }}>RUMORS</Heading>
        <div style={{ overflowY: 'auto' }}>
          {rumors.recent.length === 0 && <span className={styles.empty}>No rumors yet.</span>}
          {rumors.recent.slice(0, 8).map((text, i) => (
            <RumorRow key={i} text={text} />
          ))}
        </div>
      </div>
    </div>
  )
}
