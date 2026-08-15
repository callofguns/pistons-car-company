import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { currentHqLevel, nextHqLevel } from '../core/hq'
import { useT } from '../i18n/useT'
import { StatRow } from '../components/StatRow'
import { RumorRow } from '../components/RumorRow'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** Company overview: name/city, headline stats, the HQ panel, and the Rumors feed. */
export function CompanyScreen() {
  useGameStore((s) => s.revision)
  const company = useGameStore((s) => s.world.company)
  const rumors = useGameStore((s) => s.world.rumors)
  const catalog = useGameStore((s) => s.catalog)
  const upgradeHq = useGameStore((s) => s.upgradeHq)
  const { t, fmt } = useT()

  const [hqError, setHqError] = useState(false)

  const level = currentHqLevel(catalog.hqLevels, company.hqLevel)
  const next = nextHqLevel(catalog.hqLevels, company.hqLevel)

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

        <Heading style={{ fontSize: '1.1rem', marginTop: 'var(--space-3)' }}>{t('company.hqTitle')}</Heading>
        <StatRow label={t('company.hqLevel')} value={t(level.displayNameKey)} />
        <StatRow label={t('company.hqSlots')} value={String(level.slots)} />
        <StatRow label={t('company.hqOverhead')} value={t('employees.perMonth', { amount: fmt.compact(level.monthlyOverhead) })} />

        {next ? (
          <>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              {t('company.hqNextLevel', { name: t(next.displayNameKey), slots: next.slots, cost: fmt.compact(next.upgradeCost) })}
            </span>
            {hqError && <span style={{ color: 'var(--color-danger)' }}>{t('company.hqNotEnoughCash')}</span>}
            <Button
              variant="primary"
              onClick={() => {
                setHqError(!upgradeHq())
              }}
            >
              {t('company.hqUpgrade')}
            </Button>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)' }}>{t('company.hqMaxLevel')}</span>
        )}
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
