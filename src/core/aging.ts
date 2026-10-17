import { addDays, daysBetween, type GameDate } from './gameDate'
import type { CarModel } from './vehicles'

/** A car sells at full strength for this many years after release... */
const FULL_FRESHNESS_YEARS = 2
/** ...then loses this much of its pull each further year... */
const FRESHNESS_LOSS_PER_YEAR = 0.11
/** ...down to this floor (a ~8-year-old design). A restyle starts the clock again. */
const MIN_FRESHNESS = 0.3

/** The day the model finished development and went on sale. */
export function releaseDate(model: CarModel): GameDate {
  return addDays(model.issueDate, model.developmentDaysTotal ?? 0)
}

export function modelAgeYears(model: CarModel, today: GameDate): number {
  return Math.max(0, daysBetween(releaseDate(model), today) / 365)
}

/** 0.3-1: how much of a new car's appeal this model still has. Buyers get bored of old designs
 * as rivals bring out newer ones - multiplies daily demand (see world.ts's marketConditionsFor). */
export function freshness(model: CarModel, today: GameDate): number {
  const age = modelAgeYears(model, today)
  if (age <= FULL_FRESHNESS_YEARS) return 1
  return Math.max(MIN_FRESHNESS, 1 - (age - FULL_FRESHNESS_YEARS) * FRESHNESS_LOSS_PER_YEAR)
}
