import { useGameStore } from '../store/useGameStore'
import { grouped, signedPercent } from '../core/numberFormat'
import { MAX_STAFF_LEVEL, maxProductionBatch, productionQualityPenaltyPercent, productionSpeedBonusPercent } from '../core/staff'
import { useT } from '../i18n/useT'
import { AdvisorPanel } from '../components/AdvisorPanel'
import { SteppedSlider } from '../components/SteppedSlider'
import { MeterBar } from '../components/MeterBar'
import { StatRow } from '../components/StatRow'
import styles from './screen.module.css'

/** The headcount/budget/XP screen. Ben Gross's tooltip trade-off (higher budget = more speed, less quality) is computed by staff.ts, this screen just displays it. */
export function EmployeesScreen() {
  useGameStore((s) => s.revision)
  const staff = useGameStore((s) => s.world.staff)
  const setBudgetLevel = useGameStore((s) => s.setBudgetLevel)
  const { t, fmt } = useT()

  return (
    <div className={styles.screen}>
      <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{grouped(staff.headcount)}</span>
      <StatRow label={t('employees.growthTrend')} value={`${staff.growthTrendPercent}%`} />

      {/* Ben Gross is a proper noun (an in-world advisor's name), not translated - same rule as
          company.companyName or rumor advisor names. */}
      <AdvisorPanel name="Ben Gross" message={t('employees.advisorMessage')} />

      <SteppedSlider
        value01={staff.budgetLevel01}
        onChange={setBudgetLevel}
        displayText={`${Math.round(staff.budgetLevel01 * 100)}%`}
      />
      <span style={{ color: 'var(--color-green)' }}>{t('employees.perMonth', { amount: fmt.compact(staff.monthlyExpense) })}</span>

      <MeterBar
        value01={staff.experienceProgress01}
        displayValue={t('employees.level', { level: staff.experienceLevel, max: MAX_STAFF_LEVEL })}
      />

      <div className={styles.grid}>
        <StatRow label={t('employees.maxBatch')} value={grouped(maxProductionBatch(staff))} />
        <StatRow label={t('employees.prodSpeed')} value={signedPercent(productionSpeedBonusPercent(staff))} />
        <StatRow label={t('employees.prodQuality')} value={signedPercent(-productionQualityPenaltyPercent(staff))} />
      </div>
    </div>
  )
}
