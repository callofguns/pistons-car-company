import { useGameStore } from '../store/useGameStore'
import { hqSlotCap } from '../core/hq'
import {
  monthlyWageBill,
  productionSpeedBonusPercent,
  researchPointsBonus,
  qualityBonusPercent,
  marketingDiscountPercent,
  unitCostReductionPercent,
} from '../core/staff'
import { signedPercent, grouped } from '../core/numberFormat'
import { useT } from '../i18n/useT'
import { EmployeeRow } from '../components/EmployeeRow'
import { StatRow } from '../components/StatRow'
import { Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** The roster/hiring screen: your current employees (left) each doing one of five jobs that feeds
 * exactly one company-wide bonus (see core/staff.ts's aggregate functions), and the applicant pool
 * (right) to hire from. Roster capacity is gated by the HQ level - see CompanyScreen's HQ panel to
 * upgrade it. */
export function EmployeesScreen() {
  useGameStore((s) => s.revision)
  const staff = useGameStore((s) => s.world.staff)
  const hqLevel = useGameStore((s) => s.world.company.hqLevel)
  const catalog = useGameStore((s) => s.catalog)
  const hireEmployee = useGameStore((s) => s.hireEmployee)
  const fireEmployee = useGameStore((s) => s.fireEmployee)
  const { t, fmt } = useT()

  const slotCap = hqSlotCap(catalog.hqLevels, hqLevel)
  const perks = catalog.employeePerks
  const atCap = staff.employees.length >= slotCap

  return (
    <div className={styles.columnsPage}>
      <div className={`${styles.column} ${styles.columnMedium}`}>
        <Heading style={{ fontSize: '1.1rem' }}>{t('employees.roster', { count: staff.employees.length, cap: slotCap })}</Heading>

        <div className={styles.grid}>
          <StatRow label={t('employees.wageBill')} value={t('employees.perMonth', { amount: fmt.compact(monthlyWageBill(staff)) })} />
          <StatRow label={t('employees.prodSpeed')} value={signedPercent(productionSpeedBonusPercent(staff, perks))} />
          <StatRow label={t('employees.researchBonus')} value={`+${grouped(Math.round(researchPointsBonus(staff, perks)))}`} />
          <StatRow label={t('employees.prodQuality')} value={signedPercent(qualityBonusPercent(staff, perks))} />
          <StatRow label={t('employees.marketingDiscount')} value={signedPercent(marketingDiscountPercent(staff, perks))} />
          <StatRow label={t('employees.unitCostReduction')} value={signedPercent(-unitCostReductionPercent(staff, perks))} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflowY: 'auto' }}>
          {staff.employees.length === 0 && <span className={styles.empty}>{t('employees.noEmployees')}</span>}
          {staff.employees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              actionLabel={t('employees.fire')}
              actionVariant="danger"
              onAction={() => fireEmployee(employee.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.column}>
        <Heading style={{ fontSize: '1.1rem' }}>{t('employees.applicants')}</Heading>
        {atCap && <span className={styles.empty}>{t('employees.atCap')}</span>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflowY: 'auto' }}>
          {staff.candidates.length === 0 && <span className={styles.empty}>{t('employees.noApplicants')}</span>}
          {staff.candidates.map((candidate) => (
            <EmployeeRow
              key={candidate.id}
              employee={candidate}
              actionLabel={t('employees.hire')}
              actionVariant="primary"
              actionDisabled={atCap}
              onAction={() => hireEmployee(candidate.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
