import { tryWithdraw, type BankState } from './economy'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Drives the Employees screen: a single 0-1 budget slider sets headcount and monthly expense, staff XP climbs over time, and the resulting level feeds two opposing modifiers - production speed up, quality down. Direct port of StaffService.cs. */
export interface StaffState {
  budgetLevel01: number
  headcount: number
  monthlyExpense: number
  experienceLevel: number
  experienceProgress01: number
  growthTrendPercent: number
  previousHeadcount: number
}

export const MAX_STAFF_LEVEL = 20

// A brand-new $250,000 company starts with a small team, not the ~97,000 employees / billions
// in cash shown in the reference screenshots - those came from a much later save. Scaled here
// so day-one staff costs are sustainable against the starting capital rather than bankrupting
// the player in the first week before they can finish designing a single car.
const BASE_HEADCOUNT = 80
const COST_PER_EMPLOYEE_PER_MONTH = 400
const XP_PER_DAY = 1 / 45 // one full level roughly every 45 days at steady state

export function createStaffState(budgetLevel01 = 0.3): StaffState {
  const staff: StaffState = {
    budgetLevel01,
    headcount: 0,
    monthlyExpense: 0,
    experienceLevel: 1,
    experienceProgress01: 0,
    growthTrendPercent: 0,
    previousHeadcount: 0,
  }
  recompute(staff)
  staff.previousHeadcount = staff.headcount
  return staff
}

export function productionSpeedBonusPercent(staff: StaffState): number {
  return staff.budgetLevel01 * 8 // up to +8% at max budget
}

export function productionQualityPenaltyPercent(staff: StaffState): number {
  return staff.budgetLevel01 * 12 // up to -12% at max budget
}

export function maxProductionBatch(staff: StaffState): number {
  return Math.round(50_000 + staff.budgetLevel01 * 450_000 * (1 + staff.experienceLevel * 0.05))
}

export function setBudgetLevel(staff: StaffState, level01: number): void {
  staff.budgetLevel01 = clamp01(level01)
  recompute(staff)
}

export function onStaffDayTick(staff: StaffState, bank: BankState): void {
  const dailyExpense = staff.monthlyExpense / 30
  tryWithdraw(bank, dailyExpense)

  staff.experienceProgress01 += XP_PER_DAY * (0.5 + staff.budgetLevel01)
  while (staff.experienceProgress01 >= 1 && staff.experienceLevel < MAX_STAFF_LEVEL) {
    staff.experienceProgress01 -= 1
    staff.experienceLevel++
  }
  if (staff.experienceLevel >= MAX_STAFF_LEVEL) staff.experienceProgress01 = 0

  recompute(staff)
  staff.growthTrendPercent =
    staff.previousHeadcount === 0
      ? 0
      : Math.round(((staff.headcount - staff.previousHeadcount) / staff.previousHeadcount) * 100)
  staff.previousHeadcount = staff.headcount
}

function recompute(staff: StaffState): void {
  staff.headcount = Math.round(BASE_HEADCOUNT + staff.budgetLevel01 * BASE_HEADCOUNT * 6 * (1 + staff.experienceLevel * 0.03))
  staff.monthlyExpense = staff.headcount * COST_PER_EMPLOYEE_PER_MONTH
}
