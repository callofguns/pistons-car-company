import { tryWithdraw, type BankState } from './economy'
import type { CarModel } from './vehicles'

/** The six channels listed on every promotion tier card, in the reference's fixed display order. */
export type PromotionChannel = 'Press' | 'Radio' | 'BillboardsAndStands' | 'TV' | 'Internet' | 'Cinemas'

export const PROMOTION_CHANNELS: PromotionChannel[] = [
  'Press', 'Radio', 'BillboardsAndStands', 'TV', 'Internet', 'Cinemas',
]

/** One of the Basic/Medium/Large promotion tier cards. unlockedChannelCount is how many of the six channels (in order) are lit up on the card; the rest render dimmed. */
export interface PromotionTierDefinition {
  id: string
  displayName: string
  unlockedChannelCount: number
  cost: number
  efficiencyMultiplier: number
  durationDays: number
  unlockYear: number
}

export function isTierUnlocked(tier: PromotionTierDefinition, currentYear: number): boolean {
  return currentYear >= tier.unlockYear
}

/** Runs an ad campaign ("LAUNCH MARKETING"). Campaign state lives directly on the CarModel it targets - MarketSimulator reads marketingEfficiencyMultiplier while active to boost daily demand. */
export function startCampaign(
  model: CarModel,
  tier: PromotionTierDefinition,
  bank: BankState,
  currentYear: number,
): boolean {
  if (!isTierUnlocked(tier, currentYear)) return false
  if (model.marketingActive) return false
  if (!tryWithdraw(bank, tier.cost)) return false

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
