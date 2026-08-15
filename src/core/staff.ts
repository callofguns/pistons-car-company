import { payMandatory, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import { createRng, randInt } from './prng'
import type { MessageKey } from '../i18n/keys'

/** The five hireable roles, each aggregating into exactly one company-wide bonus - see the
 * aggregate functions below. Direct answer to the "individual employees, each with a job that
 * does something" design: no employee is purely cosmetic. */
export type EmployeeRole = 'Engineer' | 'Assembler' | 'Designer' | 'Marketer' | 'Logistician'

export const EMPLOYEE_ROLES: EmployeeRole[] = ['Engineer', 'Assembler', 'Designer', 'Marketer', 'Logistician']

export const MAX_EMPLOYEE_SKILL = 10

/** A perk an employee may carry - 0 or 1 per employee, resolved through catalog.employeePerks (an
 * id, not a live reference, so Employee stays plain save-safe data - same rule as
 * RaceResultRecord.tierId). roleOutputMultiplier/skillGrowthMultiplier apply regardless of the
 * employee's role; marketingDiscountPercent/unitCostReductionPercent only ever get summed by the
 * Marketer/Logistician aggregates respectively, so a perk "wasted" on the wrong role is a real,
 * intentional hiring trade-off rather than a bug. */
export interface EmployeePerkDefinition {
  id: string
  nameKey: MessageKey
  descriptionKey: MessageKey
  roleOutputMultiplier?: number
  marketingDiscountPercent?: number
  unitCostReductionPercent?: number
  skillGrowthMultiplier?: number
}

export function findEmployeePerk(perks: EmployeePerkDefinition[], id: string | null): EmployeePerkDefinition | undefined {
  return id ? perks.find((p) => p.id === id) : undefined
}

/** One hired (or applicant-pool) person. Plain JSON-serializable data, no live references - name
 * is a generated proper noun, frozen at generation time and never retro-translated, same rule as
 * CarModel.name and RumorTemplateSet.advisorNames ("Ben Gross" isn't translated either). */
export interface Employee {
  id: string
  name: string
  role: EmployeeRole
  /** 1-10. Climbs slowly while employed (onStaffDayTick); resets to whatever the market rolled if
   * fired and a different candidate is hired later - skill is earned on the job, not innate. */
  skill: number
  skillProgress01: number
  perkId: string | null
  /** Derived from role/skill/perk (see computeSalary), not itself a source of truth - recomputed
   * whenever skill levels up so "can I afford this raise" stays honest. */
  monthlySalary: number
}

export interface StaffState {
  employees: Employee[]
  /** The applicant pool shown on the Employees screen - refreshed on every month rollover
   * (onStaffMonthTick), same cadence as wages. */
  candidates: Employee[]
  /** Seeded once, evolved via Math.floor(rng() * 2**31) after every refresh - the same pattern
   * RumorState.rngState/RacingState.rngState already use. */
  rngState: number
}

const BASE_SALARY_BY_ROLE: Record<EmployeeRole, number> = {
  Engineer: 3500,
  Assembler: 3000,
  Designer: 3200,
  Marketer: 2800,
  Logistician: 2800,
}

const MAX_CANDIDATE_POOL = 5
const CANDIDATE_SKILL_MIN = 1
const CANDIDATE_SKILL_MAX = 5
const CANDIDATE_PERK_CHANCE = 0.35
const SKILL_PROGRESS_PER_DAY = 1 / 60 // one full skill level roughly every 60 days at steady state

function computeSalary(role: EmployeeRole, skill: number, perkId: string | null): number {
  const perkMultiplier = perkId ? 1.25 : 1
  return Math.round(BASE_SALARY_BY_ROLE[role] * (1 + skill * 0.15) * perkMultiplier)
}

let employeeIdCounter = 0
function nextEmployeeId(prefix: string): string {
  employeeIdCounter += 1
  return `${prefix}-${employeeIdCounter}`
}

function generateCandidate(rng: () => number, names: string[], perks: EmployeePerkDefinition[]): Employee {
  const role = EMPLOYEE_ROLES[randInt(rng, 0, EMPLOYEE_ROLES.length)]
  const name = names.length > 0 ? names[randInt(rng, 0, names.length)] : 'Unnamed Applicant'
  const skill = randInt(rng, CANDIDATE_SKILL_MIN, CANDIDATE_SKILL_MAX + 1)
  const perkId = perks.length > 0 && rng() < CANDIDATE_PERK_CHANCE ? perks[randInt(rng, 0, perks.length)].id : null
  return {
    id: nextEmployeeId('candidate'),
    name,
    role,
    skill,
    skillProgress01: 0,
    perkId,
    monthlySalary: computeSalary(role, skill, perkId),
  }
}

function refreshCandidates(staff: StaffState, names: string[], perks: EmployeePerkDefinition[]): void {
  const rng = createRng(staff.rngState)
  staff.candidates = Array.from({ length: MAX_CANDIDATE_POOL }, () => generateCandidate(rng, names, perks))
  staff.rngState = Math.floor(rng() * 2 ** 31)
}

export function createStaffState(names: string[], perks: EmployeePerkDefinition[], seed = 333): StaffState {
  const staff: StaffState = { employees: [], candidates: [], rngState: seed }
  refreshCandidates(staff, names, perks)
  return staff
}

/** Refuses once the roster is at the HQ's current slot cap (see core/hq.ts's hqSlotCap) - "upgrade
 * the office to hire more people" is the whole point of tying these two systems together. */
export function hireEmployee(staff: StaffState, candidateId: string, slotCap: number): boolean {
  if (staff.employees.length >= slotCap) return false
  const index = staff.candidates.findIndex((c) => c.id === candidateId)
  if (index === -1) return false
  const [hired] = staff.candidates.splice(index, 1)
  staff.employees.push(hired)
  return true
}

/** Immediate, no severance - a clean, reversible decision rather than a modeled notice period. */
export function fireEmployee(staff: StaffState, employeeId: string): void {
  staff.employees = staff.employees.filter((e) => e.id !== employeeId)
}

export function monthlyWageBill(staff: StaffState): number {
  return staff.employees.reduce((sum, e) => sum + e.monthlySalary, 0)
}

/** How large a production run a newly finalized model can target (CarModel.plannedProductionRun -
 * see vehicleService.ts's finalizeDesign). Scales with total headcount regardless of role, not
 * just Assemblers - a bigger roster overall means a bigger operation, even if the production-speed
 * bonus itself is Assembler-specific. Replaces the old budget-slider formula
 * (50_000 + budgetLevel01 * 450_000 * (1 + experienceLevel * 0.05)); this covers a comparable
 * range across the roster's 3-22 slot span (see data/hqLevels.ts). */
export function maxProductionBatch(staff: StaffState): number {
  return Math.round(50_000 + staff.employees.length * 25_000)
}

function sumRoleOutput(staff: StaffState, perks: EmployeePerkDefinition[], role: EmployeeRole, perSkillPoint: number): number {
  let total = 0
  for (const e of staff.employees) {
    if (e.role !== role) continue
    const perk = findEmployeePerk(perks, e.perkId)
    total += e.skill * perSkillPoint * (perk?.roleOutputMultiplier ?? 1)
  }
  return total
}

function sumPerkFlatBonus(
  staff: StaffState,
  perks: EmployeePerkDefinition[],
  role: EmployeeRole,
  field: 'marketingDiscountPercent' | 'unitCostReductionPercent',
): number {
  let total = 0
  for (const e of staff.employees) {
    if (e.role !== role) continue
    total += findEmployeePerk(perks, e.perkId)?.[field] ?? 0
  }
  return total
}

/** Assemblers speed up the factory - feeds onProductionDayTick's speedMultiplier, same role/signature onProductionDayTick already had. Capped so a maxed-out roster can't push production speed to absurd multiples. */
export function productionSpeedBonusPercent(staff: StaffState, perks: EmployeePerkDefinition[]): number {
  return Math.min(60, sumRoleOutput(staff, perks, 'Assembler', 0.8))
}

/** Engineers add flat research points/day on top of GameConfig.researchPointsPerDay. */
export function researchPointsBonus(staff: StaffState, perks: EmployeePerkDefinition[]): number {
  return sumRoleOutput(staff, perks, 'Engineer', 0.6)
}

/** Designers nudge a newly finalized model's reliabilityPercent up (see vehicleService.ts's
 * finalizeDesign) - capped low since carSpecsCalculator.ts's own reliability ceiling is 99. */
export function qualityBonusPercent(staff: StaffState, perks: EmployeePerkDefinition[]): number {
  return Math.min(15, sumRoleOutput(staff, perks, 'Designer', 0.6))
}

/** Marketers cut campaign cost (see marketing.ts's startCampaign). */
export function marketingDiscountPercent(staff: StaffState, perks: EmployeePerkDefinition[]): number {
  return Math.min(60, sumRoleOutput(staff, perks, 'Marketer', 1.2) + sumPerkFlatBonus(staff, perks, 'Marketer', 'marketingDiscountPercent'))
}

/** Logisticians cut per-unit production cost (see production.ts's onProductionDayTick). */
export function unitCostReductionPercent(staff: StaffState, perks: EmployeePerkDefinition[]): number {
  return Math.min(50, sumRoleOutput(staff, perks, 'Logistician', 1.0) + sumPerkFlatBonus(staff, perks, 'Logistician', 'unitCostReductionPercent'))
}

/** Skill growth only - wages/candidate refresh are billed once a month, see onStaffMonthTick. */
export function onStaffDayTick(staff: StaffState, perks: EmployeePerkDefinition[]): void {
  for (const employee of staff.employees) {
    // Zeroes stale progress a max-skill employee might be carrying (e.g. loaded from an older
    // save) rather than leaving it stuck non-zero forever - the cleanup below this early-out can
    // never run for an already-maxed employee otherwise.
    if (employee.skill >= MAX_EMPLOYEE_SKILL) {
      employee.skillProgress01 = 0
      continue
    }
    const growthMultiplier = findEmployeePerk(perks, employee.perkId)?.skillGrowthMultiplier ?? 1
    employee.skillProgress01 += SKILL_PROGRESS_PER_DAY * growthMultiplier
    while (employee.skillProgress01 >= 1 && employee.skill < MAX_EMPLOYEE_SKILL) {
      employee.skillProgress01 -= 1
      employee.skill++
      employee.monthlySalary = computeSalary(employee.role, employee.skill, employee.perkId)
    }
    if (employee.skill >= MAX_EMPLOYEE_SKILL) employee.skillProgress01 = 0
  }
}

/** Call on month rollover (day === 1): wages are a mandatory expense - the company can't just skip
 * payroll, so this can push the balance negative rather than silently failing when cash is short.
 * Also refreshes the applicant pool, same cadence as wages. */
export function onStaffMonthTick(staff: StaffState, names: string[], perks: EmployeePerkDefinition[], bank: BankState, ledger: LedgerState, today: GameDate): void {
  payMandatory(bank, ledger, monthlyWageBill(staff), 'Staff', today)
  refreshCandidates(staff, names, perks)
}
