import { tryWithdrawRecorded, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { CompanyState } from './company'
import type { GameDate } from './gameDate'
import type { MessageKey } from '../i18n/keys'

/**
 * One rung of the HQ ladder - a linear, sequential progression (not the Promotion/Racing tier-card
 * grid, which presents parallel choices) since there's only ever one "current level" and one
 * "next level" to buy. Growing the office is purely about staff capacity - see staff.ts's
 * hireEmployee, gated on hqSlotCap below - the production/research/etc speedups come from the
 * people filling those slots, not from the building itself. Replaces the old flat
 * GameConfig.hqOverheadPerMonth placeholder.
 */
export interface HQLevelDefinition {
  /** 1-based; level 1 is the free starting HQ every company begins with. */
  level: number
  displayNameKey: MessageKey
  /** Employee roster capacity at this level. */
  slots: number
  /** Replaces the old flat GameConfig.hqOverheadPerMonth - billed on world.ts's day===1 tick. */
  monthlyOverhead: number
  /** One-time cost to reach this level FROM (level - 1); 0 for level 1 (nothing to buy into). */
  upgradeCost: number
}

export function currentHqLevel(levels: HQLevelDefinition[], hqLevel: number): HQLevelDefinition {
  return levels.find((l) => l.level === hqLevel) ?? levels[0]
}

export function nextHqLevel(levels: HQLevelDefinition[], hqLevel: number): HQLevelDefinition | undefined {
  return levels.find((l) => l.level === hqLevel + 1)
}

export function hqSlotCap(levels: HQLevelDefinition[], hqLevel: number): number {
  return currentHqLevel(levels, hqLevel).slots
}

export function hqMonthlyOverhead(levels: HQLevelDefinition[], hqLevel: number): number {
  return currentHqLevel(levels, hqLevel).monthlyOverhead
}

/** Upgrades to the next level, charging its upgradeCost. Sequential-only (there's no skipping
 * levels) and one-way - fails when already at the max level or the cost is unaffordable. */
export function upgradeHq(
  company: CompanyState,
  levels: HQLevelDefinition[],
  bank: BankState,
  ledger: LedgerState,
  today: GameDate,
): boolean {
  const next = nextHqLevel(levels, company.hqLevel)
  if (!next) return false
  if (!tryWithdrawRecorded(bank, ledger, next.upgradeCost, 'HQUpgrade', today)) return false

  company.hqLevel = next.level
  return true
}
