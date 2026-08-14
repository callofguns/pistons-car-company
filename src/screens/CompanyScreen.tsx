import { useGameStore } from '../store/useGameStore'
import { useT } from '../i18n/useT'
import { StatRow } from '../components/StatRow'
import { RumorRow } from '../components/RumorRow'
import { Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** Company overview: name/city, headline stats, and the Rumors feed. */
export function CompanyScreen() {
  useGameStore((s) => s.revision)
  const company = useGameStore((s) => s.world.company)
  const rumors = useGameStore((s) => s.world.rumors)
  const { t, fmt } = useT()

  return (
    <div className={styles.columnsPage}>
      <div className={`${styles.column} ${styles.columnMedium}`}>
        <div style={{ fontSize: '4rem', textAlign: 'center' }}>🐎</div>
        <Heading style={{ textAlign: 'center' }}>{company.companyName}</Heading>
        <span style={{ textAlign: 'center', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
          {company.homeCity}
        </span>

        <StatRow label={t('company.autoReleased')} value={String(company.autoReleasedCount)} />
        <StatRow label={t('company.totalSold')} value={fmt.compact(company.totalCarsSoldAllModels)} />
        <StatRow label={t('company.marketShare')} value={fmt.percent(company.marketSharePercent, 0)} />
        <StatRow label={t('company.earned')} value={fmt.compact(company.lifetimeEarnings)} />
      </div>

      <div className={styles.column}>
        <Heading style={{ fontSize: '1.1rem' }}>{t('company.rumors')}</Heading>
        <div style={{ overflowY: 'auto' }}>
          {rumors.recent.length === 0 && <span className={styles.empty}>{t('company.noRumors')}</span>}
          {rumors.recent.slice(0, 8).map((text, i) => (
            <RumorRow key={i} text={text} />
          ))}
        </div>
      </div>
    </div>
  )
}
