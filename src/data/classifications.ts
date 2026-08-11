import type { DesignStatKey } from '../core/designStats'

/** The 7 market-positioning tags from the reference's "Car Classification" screen. */
export type ClassificationTagId = 'budget' | 'medium' | 'off-road' | 'premium' | 'luxury' | 'sport' | 'track'

export interface ClassificationTagDefinition {
  id: ClassificationTagId
  label: string
  description: string
  /** Multiplies suggestedPrice - budget cars sell for less, luxury/track cars for much more. */
  priceMultiplier: number
  /** The 0-100 design-stat profile this tag promises buyers; see designFitPercent. */
  statTargets: Partial<Record<DesignStatKey, number>>
}

/** A player picks exactly 2 of these per design, matching the reference's dual-slot picker. */
export const CLASSIFICATION_TAGS: ClassificationTagDefinition[] = [
  {
    id: 'budget',
    label: 'Budget',
    description: 'Affordable car for everyday buyers.',
    priceMultiplier: 0.75,
    statTargets: { comfort: 20, prestige: 10, safety: 35 },
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Mid-priced car suitable for the city.',
    priceMultiplier: 1,
    statTargets: { comfort: 45, prestige: 30, safety: 55 },
  },
  {
    id: 'off-road',
    label: 'Off-Road',
    description: 'Built to handle rough terrain.',
    priceMultiplier: 1.1,
    statTargets: { offroad: 75, safety: 55, handling: 30 },
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Business class car.',
    priceMultiplier: 1.5,
    statTargets: { comfort: 65, prestige: 60, safety: 65 },
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Top-tier comfort and prestige.',
    priceMultiplier: 2.1,
    statTargets: { comfort: 85, prestige: 90, attractiveness: 70 },
  },
  {
    id: 'sport',
    label: 'Sport',
    description: 'Car with a sporty character.',
    priceMultiplier: 1.6,
    statTargets: { handling: 80, attractiveness: 65, safety: 40 },
  },
  {
    id: 'track',
    label: 'Track',
    description: 'Purpose-built for the racetrack.',
    priceMultiplier: 1.8,
    statTargets: { handling: 95, offroad: 5, comfort: 10 },
  },
]

export function findClassificationTag(id: string): ClassificationTagDefinition | undefined {
  return CLASSIFICATION_TAGS.find((t) => t.id === id)
}
