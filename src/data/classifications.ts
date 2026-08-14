import type { DesignStatKey } from '../core/designStats'
import type { MessageKey } from '../i18n/keys'

/** The 7 market-positioning tags from the reference's "Car Classification" screen. */
export type ClassificationTagId = 'budget' | 'medium' | 'off-road' | 'premium' | 'luxury' | 'sport' | 'track'

/** Every tag belongs to exactly one of two independent groups: Class is the price/market tier,
 * Type is the vehicle's use-case character. The picker's two slots are dedicated one-per-group -
 * picking a new tag replaces whichever tag (if any) is already selected in that same group. */
export type ClassificationCategory = 'class' | 'type'

export interface ClassificationTagDefinition {
  id: ClassificationTagId
  /** English source string - kept only as a stable non-translated fallback (e.g. for the
   * deprecated CarModel.categoryTag field, see vehicleService.ts). Every display site should use
   * labelKey/descriptionKey instead, resolved through i18n's t() - see data.classification.* in
   * src/i18n/locales/en.ts. Note 'medium' here is a genuinely different word in ES/FR than
   * data.loanTier.medium.name or data.promoTier.medium.name despite sharing this English label. */
  label: string
  labelKey: MessageKey
  category: ClassificationCategory
  description: string
  descriptionKey: MessageKey
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
    labelKey: 'data.classification.budget.label',
    category: 'class',
    description: 'Affordable car for everyday buyers.',
    descriptionKey: 'data.classification.budget.description',
    priceMultiplier: 0.75,
    statTargets: { comfort: 20, prestige: 10, safety: 35 },
  },
  {
    id: 'medium',
    label: 'Medium',
    labelKey: 'data.classification.medium.label',
    category: 'class',
    description: 'Mid-priced car suitable for the city.',
    descriptionKey: 'data.classification.medium.description',
    priceMultiplier: 1,
    statTargets: { comfort: 45, prestige: 30, safety: 55 },
  },
  {
    id: 'premium',
    label: 'Premium',
    labelKey: 'data.classification.premium.label',
    category: 'class',
    description: 'Business class car.',
    descriptionKey: 'data.classification.premium.description',
    priceMultiplier: 1.5,
    statTargets: { comfort: 65, prestige: 60, safety: 65 },
  },
  {
    id: 'luxury',
    label: 'Luxury',
    labelKey: 'data.classification.luxury.label',
    category: 'class',
    description: 'Top-tier comfort and prestige.',
    descriptionKey: 'data.classification.luxury.description',
    priceMultiplier: 2.1,
    statTargets: { comfort: 85, prestige: 90, attractiveness: 70 },
  },
  {
    id: 'off-road',
    label: 'Off-Road',
    labelKey: 'data.classification.off-road.label',
    category: 'type',
    description: 'Built to handle rough terrain.',
    descriptionKey: 'data.classification.off-road.description',
    priceMultiplier: 1.1,
    statTargets: { offroad: 75, safety: 55, handling: 30 },
  },
  {
    id: 'sport',
    label: 'Sport',
    labelKey: 'data.classification.sport.label',
    category: 'type',
    description: 'Car with a sporty character.',
    descriptionKey: 'data.classification.sport.description',
    priceMultiplier: 1.6,
    statTargets: { handling: 80, attractiveness: 65, safety: 40 },
  },
  {
    id: 'track',
    label: 'Track',
    labelKey: 'data.classification.track.label',
    category: 'type',
    description: 'Purpose-built for the racetrack.',
    descriptionKey: 'data.classification.track.description',
    priceMultiplier: 1.8,
    statTargets: { handling: 95, offroad: 5, comfort: 10 },
  },
]

export function findClassificationTag(id: string): ClassificationTagDefinition | undefined {
  return CLASSIFICATION_TAGS.find((t) => t.id === id)
}
