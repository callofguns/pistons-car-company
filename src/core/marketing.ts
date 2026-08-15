import { tryWithdrawRecorded, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import type { CarModel } from './vehicles'
import type { MessageKey } from '../i18n/keys'

/** The six channels listed on every promotion tier card, in the reference's fixed display order. */
export type PromotionChannel = 'Press' | 'Radio' | 'BillboardsAndStands' | 'TV' | 'Internet' | 'Cinemas'

export const PROMOTION_CHANNELS: PromotionChannel[] = [
  'Press', 'Radio', 'BillboardsAndStands', 'TV', 'Internet', 'Cinemas',
]

/** One of the Basic/Medium/Large promotion tier cards. unlockedChannelCount is how many of the six channels (in order) are lit up on the card; the rest render dimmed. */
export interface PromotionTierDefinition {
  id: string
  /** English source string, non-translated fallback only - PromotionTierCard displays
   * displayNameKey via t() instead. 'Medium' here is a DIFFERENT key/word than
   * data.loanTier.medium.name or data.classification.medium.label - see i18n/locales/en.ts's
   * module doc. Type-only MessageKey import here (erased at compile time) doesn't pull any i18n
   * runtime code into core/, so this stays as testable/pure as every other core module. */
  displayName: string
  displayNameKey: MessageKey
  unlockedChannelCount: number
  cost: number
  efficiencyMultiplier: number
  durationDays: number
  unlockYear: number
}

export function isTierUnlocked(tier: PromotionTierDefinition, currentYear: number): boolean {
  return currentYear >= tier.unlockYear
}

/** Runs an ad campaign ("LAUNCH MARKETING"). Campaign state lives directly on the CarModel it
 * targets - MarketSimulator reads marketingEfficiencyMultiplier while active to boost daily
 * demand. marketingDiscountPercent comes from staff.ts's Marketer aggregate - a strong marketing
 * team makes every campaign cheaper to run. */
export function startCampaign(
  model: CarModel,
  tier: PromotionTierDefinition,
  bank: BankState,
  ledger: LedgerState,
  currentYear: number,
  today: GameDate,
  marketingDiscountPercent = 0,
): boolean {
  if (!isTierUnlocked(tier, currentYear)) return false
  if (model.marketingActive) return false
  const cost = tier.cost * (1 - Math.min(90, Math.max(0, marketingDiscountPercent)) / 100)
  // Was a bare tryWithdraw() - campaign spend never touched the ledger, even though 'Marketing'
  // has always been a real TransactionCategory (ledger.ts) with an already-translated
  // Finance-screen row (BankScreen.tsx) that simply never lit up. Same bug as registerTeam's
  // (core/racing.ts) and now startResearch's/selectBody's.
  if (!tryWithdrawRecorded(bank, ledger, cost, 'Marketing', today)) return false

  model.marketingActive = true
  model.marketingDaysRemaining = tier.durationDays
  model.marketingEfficiencyMultiplier = tier.efficiencyMultiplier
  return true
}

/** Returns the models whose campaign expired this tick (empty most days) - world.ts's News hook
 * uses this to post MarketingCampaignEnded without a separate before/after diff. */
export function onMarketingDayTick(models: CarModel[]): CarModel[] {
  const justEnded: CarModel[] = []
  for (const model of models) {
    if (!model.marketingActive) continue

    model.marketingDaysRemaining--
    if (model.marketingDaysRemaining <= 0) {
      model.marketingActive = false
      model.marketingEfficiencyMultiplier = 1
      justEnded.push(model)
    }
  }
  return justEnded
}
