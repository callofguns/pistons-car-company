import { describe, expect, it } from 'vitest'
import {
  createStaffState,
  hireEmployee,
  fireEmployee,
  monthlyWageBill,
  productionSpeedBonusPercent,
  researchPointsBonus,
  qualityBonusPercent,
  marketingDiscountPercent,
  unitCostReductionPercent,
  onStaffDayTick,
  onStaffMonthTick,
  maxProductionBatch,
  MAX_EMPLOYEE_SKILL,
  type Employee,
  type EmployeePerkDefinition,
} from '../src/core/staff'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { makeDate } from '../src/core/gameDate'

const NAMES = ['Test One', 'Test Two', 'Test Three']

const PERKS: EmployeePerkDefinition[] = [
  { id: 'prodigy-test', nameKey: 'data.employeePerk.prodigy.name', descriptionKey: 'data.employeePerk.prodigy.description', skillGrowthMultiplier: 3 },
  {
    id: 'negotiator-test',
    nameKey: 'data.employeePerk.negotiator.name',
    descriptionKey: 'data.employeePerk.negotiator.description',
    marketingDiscountPercent: 20,
  },
]

function fixtureEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: overrides.id ?? 'fixture-1',
    name: 'Fixture Person',
    role: 'Assembler',
    skill: 5,
    skillProgress01: 0,
    perkId: null,
    monthlySalary: 3000,
    ...overrides,
  }
}

describe('createStaffState', () => {
  it('starts with no employees and a full candidate pool', () => {
    const staff = createStaffState(NAMES, PERKS)
    expect(staff.employees).toEqual([])
    expect(staff.candidates).toHaveLength(5)
  })

  it('is deterministic for a fixed seed', () => {
    // Compares everything except `id`, which comes from a module-level counter shared across the
    // whole test file (and real gameplay) - not itself part of the "same seed -> same rolls"
    // determinism this test is pinning (same exclusion racing.test.ts uses for the same reason).
    const strip = (candidates: ReturnType<typeof createStaffState>['candidates']) => candidates.map((c) => ({ ...c, id: undefined }))
    const a = createStaffState(NAMES, PERKS, 42)
    const b = createStaffState(NAMES, PERKS, 42)
    expect(strip(a.candidates)).toEqual(strip(b.candidates))
  })
})

describe('hireEmployee / fireEmployee', () => {
  it('moves a candidate into employees and out of the candidate pool', () => {
    const staff = createStaffState(NAMES, PERKS)
    const candidateId = staff.candidates[0].id

    expect(hireEmployee(staff, candidateId, 3)).toBe(true)

    expect(staff.employees).toHaveLength(1)
    expect(staff.employees[0].id).toBe(candidateId)
    expect(staff.candidates.some((c) => c.id === candidateId)).toBe(false)
  })

  it('refuses to hire once the roster is at the slot cap', () => {
    const staff = createStaffState(NAMES, PERKS)
    expect(hireEmployee(staff, staff.candidates[0].id, 1)).toBe(true)
    const secondCandidateId = staff.candidates[0].id
    expect(hireEmployee(staff, secondCandidateId, 1)).toBe(false)
    expect(staff.employees).toHaveLength(1)
  })

  it('refuses to hire a candidate id that is not in the pool', () => {
    const staff = createStaffState(NAMES, PERKS)
    expect(hireEmployee(staff, 'not-a-real-id', 5)).toBe(false)
    expect(staff.employees).toHaveLength(0)
  })

  it('fireEmployee removes the employee and drops the wage bill', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [fixtureEmployee({ id: 'a', monthlySalary: 4000 }), fixtureEmployee({ id: 'b', monthlySalary: 5000 })]

    fireEmployee(staff, 'a')

    expect(staff.employees).toHaveLength(1)
    expect(staff.employees[0].id).toBe('b')
    expect(monthlyWageBill(staff)).toBe(5000)
  })

  it('firing an id not on the roster is a no-op', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [fixtureEmployee({ id: 'a' })]
    fireEmployee(staff, 'nonexistent')
    expect(staff.employees).toHaveLength(1)
  })
})

describe('monthlyWageBill', () => {
  it('sums every employee salary, ignoring candidates', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [fixtureEmployee({ id: 'a', monthlySalary: 3000 }), fixtureEmployee({ id: 'b', monthlySalary: 4500 })]
    expect(monthlyWageBill(staff)).toBe(7500)
  })

  it('is zero with no employees', () => {
    const staff = createStaffState(NAMES, PERKS)
    expect(monthlyWageBill(staff)).toBe(0)
  })
})

describe('role aggregates', () => {
  it('each aggregate only counts its own role', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [
      fixtureEmployee({ id: 'a', role: 'Assembler', skill: 10 }),
      fixtureEmployee({ id: 'b', role: 'Engineer', skill: 10 }),
      fixtureEmployee({ id: 'c', role: 'Designer', skill: 10 }),
      fixtureEmployee({ id: 'd', role: 'Marketer', skill: 10 }),
      fixtureEmployee({ id: 'e', role: 'Logistician', skill: 10 }),
    ]

    expect(productionSpeedBonusPercent(staff, PERKS)).toBeCloseTo(8) // 10 * 0.8, only the Assembler counts
    expect(researchPointsBonus(staff, PERKS)).toBeCloseTo(6) // 10 * 0.6, only the Engineer counts
    expect(qualityBonusPercent(staff, PERKS)).toBeCloseTo(6) // 10 * 0.6, only the Designer counts
    expect(marketingDiscountPercent(staff, PERKS)).toBeCloseTo(12) // 10 * 1.2, only the Marketer counts
    expect(unitCostReductionPercent(staff, PERKS)).toBeCloseTo(10) // 10 * 1.0, only the Logistician counts
  })

  it('a perk flat bonus only counts when the employee is in the matching role', () => {
    const staff = createStaffState(NAMES, PERKS)
    // Negotiator on a Marketer counts toward marketingDiscountPercent...
    staff.employees = [fixtureEmployee({ id: 'a', role: 'Marketer', skill: 0, perkId: 'negotiator-test' })]
    expect(marketingDiscountPercent(staff, PERKS)).toBeCloseTo(20)

    // ...but the exact same perk on an Engineer contributes nothing to it - "wasted" on the wrong role.
    staff.employees = [fixtureEmployee({ id: 'b', role: 'Engineer', skill: 0, perkId: 'negotiator-test' })]
    expect(marketingDiscountPercent(staff, PERKS)).toBe(0)
  })

  it('returns zero for a role with nobody in it', () => {
    const staff = createStaffState(NAMES, PERKS)
    expect(productionSpeedBonusPercent(staff, PERKS)).toBe(0)
  })
})

describe('onStaffDayTick', () => {
  it('levels up skill after enough accumulated progress, and recomputes salary', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [fixtureEmployee({ id: 'a', skill: 1, skillProgress01: 0.99 })]
    const salaryBefore = staff.employees[0].monthlySalary

    onStaffDayTick(staff, PERKS)

    expect(staff.employees[0].skill).toBe(2)
    expect(staff.employees[0].monthlySalary).toBeGreaterThan(salaryBefore)
  })

  it('never grows skill past MAX_EMPLOYEE_SKILL', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [fixtureEmployee({ id: 'a', skill: MAX_EMPLOYEE_SKILL, skillProgress01: 0.99 })]

    onStaffDayTick(staff, PERKS)

    expect(staff.employees[0].skill).toBe(MAX_EMPLOYEE_SKILL)
    expect(staff.employees[0].skillProgress01).toBe(0)
  })

  it('a skillGrowthMultiplier perk levels up faster than an identical employee without it', () => {
    const staffWithPerk = createStaffState(NAMES, PERKS)
    staffWithPerk.employees = [fixtureEmployee({ id: 'a', skill: 1, skillProgress01: 0, perkId: 'prodigy-test' })]
    const staffPlain = createStaffState(NAMES, PERKS)
    staffPlain.employees = [fixtureEmployee({ id: 'a', skill: 1, skillProgress01: 0 })]

    onStaffDayTick(staffWithPerk, PERKS)
    onStaffDayTick(staffPlain, PERKS)

    expect(staffWithPerk.employees[0].skillProgress01).toBeGreaterThan(staffPlain.employees[0].skillProgress01)
  })
})

describe('onStaffMonthTick', () => {
  it('pays the full wage bill as a mandatory expense, even pushing the balance negative', () => {
    const staff = createStaffState(NAMES, PERKS)
    staff.employees = [fixtureEmployee({ id: 'a', monthlySalary: 10_000 })]
    const bank = createBank(5_000)
    const ledger = createLedgerState()

    onStaffMonthTick(staff, NAMES, PERKS, bank, ledger, makeDate(1980, 2, 1))

    expect(bank.balance).toBe(-5_000)
    expect(ledger.monthExpenseByCategory['Staff']).toBe(10_000)
  })

  it('refreshes the candidate pool back up to a full 5', () => {
    const staff = createStaffState(NAMES, PERKS)
    hireEmployee(staff, staff.candidates[0].id, 5) // pool now has 4
    expect(staff.candidates).toHaveLength(4)

    onStaffMonthTick(staff, NAMES, PERKS, createBank(1_000_000), createLedgerState(), makeDate(1980, 2, 1))

    expect(staff.candidates).toHaveLength(5)
  })
})

describe('maxProductionBatch', () => {
  it('grows with roster size', () => {
    const empty = createStaffState(NAMES, PERKS)
    const staffed = createStaffState(NAMES, PERKS)
    staffed.employees = [fixtureEmployee({ id: 'a' }), fixtureEmployee({ id: 'b' })]

    expect(maxProductionBatch(staffed)).toBeGreaterThan(maxProductionBatch(empty))
  })
})
