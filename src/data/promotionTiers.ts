import type { PromotionTierDefinition } from '../core/marketing'

// Costs scaled down from the reference's late-game numbers (450K/900K/1.8M) for the same reason
// as research: they need to be reachable early on a $250,000 start, not just after amassing a
// fortune.
export const PROMOTION_TIERS: PromotionTierDefinition[] = [
  { id: 'basic', displayName: 'Basic', unlockedChannelCount: 3, cost: 45_000, efficiencyMultiplier: 1.15, durationDays: 3, unlockYear: 1950 },
  { id: 'medium', displayName: 'Medium', unlockedChannelCount: 4, cost: 90_000, efficiencyMultiplier: 1.35, durationDays: 5, unlockYear: 1970 },
  { id: 'large', displayName: 'Large', unlockedChannelCount: 6, cost: 180_000, efficiencyMultiplier: 1.65, durationDays: 7, unlockYear: 1991 },
]
