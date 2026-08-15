import type { RaceTierDefinition } from '../core/racing'

/** The four race tiers offered on the "ENTER A RACE" screen - same small-fixed-table,
 * unlocked-by-year shape as PROMOTION_TIERS/LOAN_TIERS, not a scheduled calendar. Fees/prizes
 * scale up proportionately to RACING_REGISTRATION_COST ($40M) across the timeline the rest of the
 * game already spans (research nodes run 1968-2026, promo tiers unlock through 1991). */
export const RACE_TIERS: RaceTierDefinition[] = [
  {
    id: 'local-circuit',
    displayNameKey: 'data.raceTier.local-circuit.name',
    entryFee: 500_000,
    firstPrize: 1_200_000,
    fieldSize: 6,
    difficultyRating: 3,
    preferredTagId: 'sport',
    unlockYear: 1978,
  },
  {
    id: 'regional-rally',
    displayNameKey: 'data.raceTier.regional-rally.name',
    entryFee: 1_200_000,
    firstPrize: 2_500_000,
    fieldSize: 8,
    difficultyRating: 5,
    preferredTagId: 'off-road',
    unlockYear: 1985,
  },
  {
    id: 'national-grand-prix',
    displayNameKey: 'data.raceTier.national-grand-prix.name',
    entryFee: 2_500_000,
    firstPrize: 5_000_000,
    fieldSize: 10,
    difficultyRating: 7,
    preferredTagId: 'track',
    unlockYear: 1995,
  },
  {
    id: 'international-endurance',
    displayNameKey: 'data.raceTier.international-endurance.name',
    entryFee: 5_000_000,
    firstPrize: 12_000_000,
    fieldSize: 12,
    difficultyRating: 9,
    // No preferredTagId - a pure reliability/power test rather than favoring one classification.
    unlockYear: 2005,
  },
]

export function findRaceTier(id: string): RaceTierDefinition | undefined {
  return RACE_TIERS.find((t) => t.id === id)
}
