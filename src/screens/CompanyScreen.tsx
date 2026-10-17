import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { currentHqLevel, nextHqLevel } from '../core/hq'
import { useT } from '../i18n/useT'
import { StatRow } from '../components/StatRow'
import { RumorRow } from '../components/RumorRow'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import companyStyles from './CompanyScreen.module.css'
import { OfficeArt } from '../art/OfficeArt'

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
      {/* Who you are: the HQ drawing, name, city, and the next upgrade. */}
      <div className={`${styles.column} ${styles.card} ${companyStyles.identity}`}>
        <OfficeArt level={company.hqLevel} className={companyStyles.office} title={t(level.displayNameKey)} />
        <Heading style={{ textAlign: 'center', fontSize: '1.1rem' }}>{company.companyName}</Heading>
        <span className={companyStyles.city}>{company.homeCity}</span>

        {next ? (
          <>
            <span className={companyStyles.nextLevel}>
              {t('company.hqNextLevel', { name: t(next.displayNameKey), slots: next.slots, cost: fmt.money(next.upgradeCost) })}
            </span>
            {hqError && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{t('company.hqNotEnoughCash')}</span>}
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
          <span className={companyStyles.nextLevel}>{t('company.hqMaxLevel')}</span>
        )}
      </div>

      {/* The numbers. */}
      <div className={`${styles.column} ${styles.card}`}>
        <StatRow label={t('company.autoReleased')} value={String(company.autoReleasedCount)} />
        <StatRow label={t('company.totalSold')} value={fmt.compact(company.totalCarsSoldAllModels)} />
        <StatRow label={t('company.marketShare')} value={fmt.percent(company.marketSharePercent, 0)} />
        <StatRow label={t('company.earned')} value={fmt.money(company.lifetimeEarnings)} />
        <h3 className={styles.sectionTitle} style={{ marginTop: 'var(--space-2)' }}>
          {t('company.hqTitle')}
        </h3>
        <StatRow label={t('company.hqLevel')} value={t(level.displayNameKey)} />
        <StatRow label={t('company.hqSlots')} value={String(level.slots)} />
        <StatRow label={t('company.hqOverhead')} value={t('employees.perMonth', { amount: fmt.money(level.monthlyOverhead) })} />
      </div>

      {/* Gossip feed - scrolls on its own. */}
      <div className={`${styles.column} ${styles.card}`}>
        <h3 className={styles.sectionTitle}>{t('company.rumors')}</h3>
        {rumors.recent.length === 0 && <span className={styles.empty}>{t('company.noRumors')}</span>}
        {rumors.recent.slice(0, 8).map((text, i) => (
          <RumorRow key={i} text={text} />
        ))}
      </div>
    </div>
  )
}
