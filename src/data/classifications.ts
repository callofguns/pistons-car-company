import type { DesignStatKey } from '../core/designStats'

/** The 7 market-positioning tags from the reference's "Car Classification" screen. */
export type ClassificationTagId = 'budget' | 'medium' | 'off-road' | 'premium' | 'luxury' | 'sport' | 'track'

/** Every tag belongs to exactly one of two independent groups: Class is the price/market tier,
 * Type is the vehicle's use-case character. The picker's two slots are dedicated one-per-group -
 * picking a new tag replaces whichever tag (if any) is already selected in that same group. */
export type ClassificationCategory = 'class' | 'type'

export interface ClassificationTagDefinition {
  id: ClassificationTagId
  label: string
  category: ClassificationCategory
  description: string
  /** Multiplies suggestedPrice - budget cars sell for less, luxury/track cars for much more. */
  priceMultiplier: number
  /** The 0-100 design-stat profile this tag promises buyers; see designFitPercent. */
  statTargets: Partial<Record<DesignStatKey, number>>
}

/** A player picks exactly one Class tag and one Type tag per design, matching the reference's
 * dual-slot picker. */
export const CLASSIFICATION_TAGS: ClassificationTagDefinition[] = [
  {
    id: 'budget',
    label: 'Budget',
    category: 'class',
    description: 'Affordable car for everyday buyers.',
    priceMultiplier: 0.75,
    statTargets: { comfort: 20, prestige: 10, safety: 35 },
  },
  {
    id: 'medium',
    label: 'Medium',
    category: 'class',
    description: 'Mid-priced car suitable for the city.',
    priceMultiplier: 1,
    statTargets: { comfort: 45, prestige: 30, safety: 55 },
  },
  {
    id: 'premium',
    label: 'Premium',
    category: 'class',
    description: 'Business class car.',
    priceMultiplier: 1.5,
    statTargets: { comfort: 65, prestige: 60, safety: 65 },
  },
  {
    id: 'luxury',
    label: 'Luxury',
    category: 'class',
    description: 'Top-tier comfort and prestige.',
    priceMultiplier: 2.1,
    statTargets: { comfort: 85, prestige: 90, attractiveness: 70 },
  },
  {
    id: 'off-road',
    label: 'Off-Road',
    category: 'type',
    description: 'Built to handle rough terrain.',
    priceMultiplier: 1.1,
    statTargets: { offroad: 75, safety: 55, handling: 30 },
  },
  {
    id: 'sport',
    label: 'Sport',
    category: 'type',
    description: 'Car with a sporty character.',
    priceMultiplier: 1.6,
    statTargets: { handling: 80, attractiveness: 65, safety: 40 },
  },
  {
    id: 'track',
    label: 'Track',
    category: 'type',
    description: 'Purpose-built for the racetrack.',
    priceMultiplier: 1.8,
    statTargets: { handling: 95, offroad: 5, comfort: 10 },
  },
]

export function findClassificationTag(id: string): ClassificationTagDefinition | undefined {
  return CLASSIFICATION_TAGS.find((t) => t.id === id)
}
