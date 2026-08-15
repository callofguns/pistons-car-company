import type { EmployeePerkDefinition } from '../core/staff'

/**
 * The six perks a candidate may roll (0 or 1, see staff.ts's generateCandidate). Each perk sticks
 * to one clear effect rather than stacking several, so a hiring decision reads as "this specific
 * trade-off" rather than a pile of small modifiers. roleOutputMultiplier/skillGrowthMultiplier
 * apply no matter the employee's role; marketingDiscountPercent/unitCostReductionPercent only ever
 * get counted by the Marketer/Logistician aggregates respectively (see staff.ts's
 * sumPerkFlatBonus) - a Negotiator hired as an Engineer just doesn't cash in that part of the
 * perk, which is intentional flavor, not a bug.
 */
export const EMPLOYEE_PERKS: EmployeePerkDefinition[] = [
  {
    id: 'negotiator',
    nameKey: 'data.employeePerk.negotiator.name',
    descriptionKey: 'data.employeePerk.negotiator.description',
    marketingDiscountPercent: 15,
  },
  {
    id: 'prodigy',
    nameKey: 'data.employeePerk.prodigy.name',
    descriptionKey: 'data.employeePerk.prodigy.description',
    skillGrowthMultiplier: 2,
  },
  {
    id: 'mentor',
    nameKey: 'data.employeePerk.mentor.name',
    descriptionKey: 'data.employeePerk.mentor.description',
    roleOutputMultiplier: 1.25,
  },
  {
    id: 'perfectionist',
    nameKey: 'data.employeePerk.perfectionist.name',
    descriptionKey: 'data.employeePerk.perfectionist.description',
    roleOutputMultiplier: 1.15,
    skillGrowthMultiplier: 0.85,
  },
  {
    id: 'efficient',
    nameKey: 'data.employeePerk.efficient.name',
    descriptionKey: 'data.employeePerk.efficient.description',
    unitCostReductionPercent: 12,
  },
  {
    id: 'veteran',
    nameKey: 'data.employeePerk.veteran.name',
    descriptionKey: 'data.employeePerk.veteran.description',
    roleOutputMultiplier: 1.35,
  },
]

export function findEmployeePerkDefinition(id: string): EmployeePerkDefinition | undefined {
  return EMPLOYEE_PERKS.find((p) => p.id === id)
}
