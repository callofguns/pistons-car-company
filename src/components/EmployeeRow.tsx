import type { Employee, EmployeeRole } from '../core/staff'
import { MAX_EMPLOYEE_SKILL } from '../core/staff'
import { findEmployeePerkDefinition } from '../data/employeePerks'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { MeterBar } from './MeterBar'
import { Button } from './Primitives'
import styles from './EmployeeRow.module.css'

const ROLE_LABEL_KEY: Record<EmployeeRole, MessageKey> = {
  Engineer: 'data.employeeRole.Engineer',
  Assembler: 'data.employeeRole.Assembler',
  Designer: 'data.employeeRole.Designer',
  Marketer: 'data.employeeRole.Marketer',
  Logistician: 'data.employeeRole.Logistician',
}

interface EmployeeRowProps {
  employee: Employee
  actionLabel: string
  actionVariant?: 'primary' | 'secondary' | 'danger'
  actionDisabled?: boolean
  onAction: () => void
}

/** One roster or applicant-pool row - name, role, skill meter, perk chip (if any), salary, and a
 * single action button (HIRE on the applicant pool, FIRE on the roster) - the same shape covers
 * both lists, matching EmployeesScreen's design. */
export function EmployeeRow({ employee, actionLabel, actionVariant = 'secondary', actionDisabled, onAction }: EmployeeRowProps) {
  const { t, fmt } = useT()
  const perk = findEmployeePerkDefinition(employee.perkId ?? '')

  return (
    <div className={styles.row}>
      <div className={styles.identity}>
        <span className={styles.name}>{employee.name}</span>
        <span className={styles.role}>{t(ROLE_LABEL_KEY[employee.role])}</span>
        {perk && (
          <span className={styles.perk} title={t(perk.descriptionKey)}>
            {t(perk.nameKey)}
          </span>
        )}
      </div>

      <MeterBar value01={employee.skill / MAX_EMPLOYEE_SKILL} displayValue={`${employee.skill}/${MAX_EMPLOYEE_SKILL}`} />

      <span className={styles.salary}>{t('employees.perMonth', { amount: fmt.compact(employee.monthlySalary) })}</span>

      <Button variant={actionVariant} disabled={actionDisabled} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
