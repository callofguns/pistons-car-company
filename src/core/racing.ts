import { tryWithdrawRecorded, depositRecorded, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { CompanyState } from './company'
import type { CarModel } from './vehicles'
import type { ClassificationTagId } from '../data/classifications'
import type { GameDate } from './gameDate'
import { createRng, randInt } from './prng'
import type { MessageKey } from '../i18n/keys'

/** One of the Local Circuit/Regional Rally/National Grand Prix/International Endurance tiers -
 * same "small fixed table, unlocked by year" shape as PromotionTierDefinition (marketing.ts) and
 * LoanTierDefinition (loanTiers.ts), not a scheduled calendar of dated events. The player can
 * enter any unlocked tier at any time; entering charges entryFee immediately (see enterRace) and
 * the race itself resolves automatically on the next month rollover (see onRacingMonthTick,
 * called from world.ts's day===1 block). */
export interface RaceTierDefinition {
  id: string
  displayNameKey: MessageKey
  entryFee: number
  /** Full payout for 1st place - see PRIZE_FRACTION_BY_POSITION below for how 2nd/3rd/else scale off this. */
  firstPrize: number
  /** Player + this many AI opponents. */
  fieldSize: number
  /** Baseline AI opponent strength, roughly the same 1-10 scale CarPerformanceStats.rating uses -
   * see raceScore()'s comment for how this becomes an actual opponent score. */
  difficultyRating: number
  /** A car whose classificationTagIds includes this tag gets a scoring bonus in this tier (e.g.
   * an off-road-tagged car in the rally tier). Omit for a tier that's a pure reliability/power
   * test with no type preference (the endurance tier). */
  preferredTagId?: ClassificationTagId
  unlockYear: number
}

export function isRaceTierUnlocked(tier: RaceTierDefinition, currentYear: number): boolean {
  return currentYear >= tier.unlockYear
}

/** One resolved race - what gets pushed onto RacingState.history and posted as a
 * 'RaceCompleted' News entry (see core/news.ts's save-data rule: modelName is player free text,
 * tierId is a stable content id resolved through i18n at *read* time - never a translated string
 * baked in here). */
export interface RaceResultRecord {
  id: string
  tierId: string
  modelName: string
  position: number
  fieldSize: number
  prize: number
  date: GameDate
}

const MAX_RACE_HISTORY = 20

export interface RacingState {
  isRegistered: boolean
  teamName: string
  /** Set by enterRace, cleared and resolved by onRacingMonthTick on the next month rollover -
   * "one team, one car entered at a time." */
  pendingEntry: { tierId: string; modelId: string; modelName: string } | null
  /** Newest first, same ring-buffer idiom as RumorState.recent (company.ts) and NewsState.entries
   * (news.ts). */
  history: RaceResultRecord[]
  /** Seeded once, evolved via Math.floor(rng() * 2**31) after every use - the exact pattern
   * RumorState.rngState (company.ts) already uses for postSaleRumor/postResearchRumor, reused
   * here instead of a fresh string-hash scheme so opponent rolls stay reproducible the same way
   * rumor selection already is. */
  rngState: number
}

export const RACING_REGISTRATION_COST = 40_000_000

export function createRacingState(seed = 555): RacingState {
  return { isRegistered: false, teamName: '', pendingEntry: null, history: [], rngState: seed }
}

export function isRacingUnlocked(currentYear: number, unlockYear: number): boolean {
  return currentYear >= unlockYear
}

/** Registers the team - the "TEAM REGISTRATION" screen. Direct port of RacingService.cs,
 * extended with real race entry/resolution below. */
export function registerTeam(
  racing: RacingState,
  teamName: string,
  bank: BankState,
  ledger: LedgerState,
  currentYear: number,
  unlockYear: number,
  today: GameDate,
): boolean {
  if (racing.isRegistered) return false
  if (!isRacingUnlocked(currentYear, unlockYear)) return false
  if (!teamName.trim()) return false
  // Was a bare tryWithdraw() - the $40M registration fee never touched the ledger, even though
  // 'Racing' has always been a real TransactionCategory (ledger.ts) with an already-translated
  // Finance-screen row (BankScreen.tsx) that simply never lit up.
  if (!tryWithdrawRecorded(bank, ledger, RACING_REGISTRATION_COST, 'Racing', today)) return false

  racing.teamName = teamName
  racing.isRegistered = true
  return true
}

/** Charges the entry fee and commits a pending entry - the race itself doesn't run until the next
 * month rollover (onRacingMonthTick). Guards: must be registered, no entry already pending (one
 * team, one car at a time), tier unlocked, fee affordable. */
export function enterRace(
  racing: RacingState,
  tier: RaceTierDefinition,
  model: CarModel,
  bank: BankState,
  ledger: LedgerState,
  currentYear: number,
  today: GameDate,
): boolean {
  if (!racing.isRegistered) return false
  if (racing.pendingEntry) return false
  if (!isRaceTierUnlocked(tier, currentYear)) return false
  if (!tryWithdrawRecorded(bank, ledger, tier.entryFee, 'Racing', today)) return false

  racing.pendingEntry = { tierId: tier.id, modelId: model.id, modelName: model.name }
  return true
}

/** 1st place gets the full firstPrize, 2nd and 3rd a shrinking fraction of it, everyone else
 * nothing - the entry fee is a real gamble, same weight of commitment RACING_REGISTRATION_COST
 * already carries. Indexed by (position - 1); missing entries (4th and worse) fall through to the
 * `?? 0` in raceScore's caller. */
const PRIZE_FRACTION_BY_POSITION = [1, 0.55, 0.3]

/** How much a single race nudges reputation by finishing position, clamped into
 * company.reputationPercent's existing 0-100 range by the caller. Small and secondary -
 * reputation is still primarily sales-driven (market.ts). */
function reputationDeltaForPosition(position: number, fieldSize: number): number {
  if (position === 1) return 1.5
  if (position === 2) return 0.8
  if (position === 3) return 0.4
  if (position > fieldSize / 2) return -0.2
  return 0
}

/** Turns a car's existing spec-sheet stats into a single race-day score - no new simulation
 * system, just a weighted read of CarPerformanceStats fields that already exist for the Model
 * Lineup screen. The exact weights are a tunable balance knob, not load-bearing game logic. */
function raceScore(model: CarModel, tier: RaceTierDefinition): number {
  const stats = model.stats
  const base =
    stats.rating * 10 +
    stats.designStats.handling * 0.3 +
    (stats.reliabilityPercent - 50) * 0.4 +
    (stats.topSpeedKph - 150) * 0.15
  const typeBonus = tier.preferredTagId && model.classificationTagIds.includes(tier.preferredTagId) ? 15 : 0
  return base + typeBonus
}

let raceIdCounter = 0

/** Resolves any pending entry on month rollover - called from world.ts's day===1 block, after
 * the staff/HQ-overhead billing and before the MonthlyReport income/expense snapshot, so a race
 * prize counts in that month's reported income (the same ordering care MonthlyReport/
 * onLedgerMonthTick already require - see world.ts's comment there).
 *
 * Follows the established onXDayTick/onXMonthTick convention (onResearchDayTick,
 * onMarketingDayTick): mutates its own slice and RETURNS the event instead of posting News
 * itself - world.ts does that. Clears pendingEntry unconditionally, even if the entered model or
 * tier can no longer be found (e.g. a save loaded from a build with a different tier table) - a
 * missing reference must not wedge the team out of racing forever. */
export function onRacingMonthTick(
  racing: RacingState,
  models: CarModel[],
  raceTiers: RaceTierDefinition[],
  company: CompanyState,
  bank: BankState,
  ledger: LedgerState,
  today: GameDate,
): RaceResultRecord | null {
  if (!racing.pendingEntry) return null
  const { tierId, modelId, modelName } = racing.pendingEntry
  racing.pendingEntry = null

  const tier = raceTiers.find((t) => t.id === tierId)
  if (!tier) return null

  const model = models.find((m) => m.id === modelId)
  const playerScore = model ? raceScore(model, tier) : 0

  const rng = createRng(racing.rngState)
  const opponentScores = Array.from({ length: Math.max(0, tier.fieldSize - 1) }, () => tier.difficultyRating * 10 + randInt(rng, -25, 26))
  racing.rngState = Math.floor(rng() * 2 ** 31)

  const position = opponentScores.filter((score) => score > playerScore).length + 1
  const prize = Math.round(tier.firstPrize * (PRIZE_FRACTION_BY_POSITION[position - 1] ?? 0))
  if (prize > 0) depositRecorded(bank, ledger, prize, 'Racing', today)

  company.reputationPercent = Math.min(100, Math.max(0, company.reputationPercent + reputationDeltaForPosition(position, tier.fieldSize)))

  raceIdCounter += 1
  const record: RaceResultRecord = { id: `race-${raceIdCounter}`, tierId, modelName, position, fieldSize: tier.fieldSize, prize, date: today }
  racing.history.unshift(record)
  if (racing.history.length > MAX_RACE_HISTORY) racing.history.length = MAX_RACE_HISTORY

  return record
}
