import type { PromotionTierDefinition } from '../core/marketing'

// Costs scaled down from the reference's late-game numbers (450K/900K/1.8M) for the same reason
// as research: they need to be reachable early on a $250,000 start, not just after amassing a
// fortune.
export const PROMOTION_TIERS: PromotionTierDefinition[] = [
  {
    id: 'basic',
    displayName: 'Basic',
    displayNameKey: 'data.promoTier.basic.name',
    unlockedChannelCount: 3,
    cost: 1_500_000,
    efficiencyMultiplier: 1.15,
    durationDays: 30,
    reachPerDay: 1_500,
    unlockYear: 1950,
  },
  {
    id: 'medium',
    displayName: 'Medium',
    displayNameKey: 'data.promoTier.medium.name',
    unlockedChannelCount: 4,
    cost: 4_000_000,
    efficiencyMultiplier: 1.3,
    durationDays: 45,
    reachPerDay: 4_000,
    unlockYear: 1970,
  },
  {
    id: 'large',
    displayName: 'Large',
    displayNameKey: 'data.promoTier.large.name',
    unlockedChannelCount: 6,
    cost: 12_000_000,
    efficiencyMultiplier: 1.5,
    durationDays: 60,
    reachPerDay: 10_000,
    unlockYear: 1991,
  },
]
