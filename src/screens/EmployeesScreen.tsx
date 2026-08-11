import { useGameStore } from '../store/useGameStore'
import { grouped, compact, signedPercent } from '../core/numberFormat'
import { MAX_STAFF_LEVEL, maxProductionBatch, productionQualityPenaltyPercent, productionSpeedBonusPercent } from '../core/staff'
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

  return (
    <div className={styles.screen}>
      <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{grouped(staff.headcount)}</span>
      <StatRow label="Growth trend" value={`${staff.growthTrendPercent}%`} />

      <AdvisorPanel
        name="Ben Gross"
        message="A high budget increases staff and production speed but can lead to corruption and reduced quality."
      />

      <SteppedSlider
        value01={staff.budgetLevel01}
        onChange={setBudgetLevel}
        displayText={`${Math.round(staff.budgetLevel01 * 100)}%`}
      />
      <span style={{ color: 'var(--color-green)' }}>{compact(staff.monthlyExpense)} / month</span>

      <MeterBar value01={staff.experienceProgress01} displayValue={`${staff.experienceLevel}/${MAX_STAFF_LEVEL} Level`} />

      <div className={styles.grid}>
        <StatRow label="Max. allowed production batch" value={grouped(maxProductionBatch(staff))} />
        <StatRow label="Production speed" value={signedPercent(productionSpeedBonusPercent(staff))} />
        <StatRow label="Production quality" value={signedPercent(-productionQualityPenaltyPercent(staff))} />
      </div>
    </div>
  )
}
