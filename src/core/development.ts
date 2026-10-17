import type { CarModel } from './vehicles'

/** Shortest and longest development period, in in-game days. */
export const MIN_DEVELOPMENT_DAYS = 20
export const MAX_DEVELOPMENT_DAYS = 90

/** Extra days on top of the cost-based length, by the design's Class tag - a Luxury car takes
 * longer to get right than a Budget one. */
const CLASS_EXTRA_DAYS: Record<string, number> = {
  budget: 0,
  medium: 7,
  premium: 14,
  luxury: 21,
}

/** Unit cost (per car) at or above which a design gets the full cost-based development time. */
const EXPENSIVE_UNIT_COST = 15_000
const CHEAP_UNIT_COST = 3_000

/**
 * How many days a freshly finished design spends in development before it can be built and sold.
 * Scales with how complex the car is: its unit cost (pricier parts, bigger engines) and its Class.
 * Always between MIN_DEVELOPMENT_DAYS and MAX_DEVELOPMENT_DAYS.
 */
export function developmentDaysFor(unitCost: number, classificationTagIds: string[]): number {
  const costT = Math.min(1, Math.max(0, (unitCost - CHEAP_UNIT_COST) / (EXPENSIVE_UNIT_COST - CHEAP_UNIT_COST)))
  const classExtra = classificationTagIds.reduce((sum, id) => sum + (CLASS_EXTRA_DAYS[id] ?? 0), 0)
  const days = MIN_DEVELOPMENT_DAYS + costT * 49 + classExtra
  return Math.round(Math.min(MAX_DEVELOPMENT_DAYS, Math.max(MIN_DEVELOPMENT_DAYS, days)))
}

/** True while a model is still being developed - it can't be built or sold yet. Models from saves
 * made before development periods existed have no developmentDaysRemaining and count as released. */
export function isInDevelopment(model: CarModel): boolean {
  return (model.developmentDaysRemaining ?? 0) > 0
}

/** 0-1 progress through a model's development period (1 once released). */
export function developmentProgress01(model: CarModel): number {
  const total = model.developmentDaysTotal ?? 0
  if (total <= 0) return 1
  return 1 - (model.developmentDaysRemaining ?? 0) / total
}

/** Advances every model in development by one day. Returns the models that finished development
 * today (so the caller can announce them). */
export function onDevelopmentDayTick(models: CarModel[]): CarModel[] {
  const released: CarModel[] = []
  for (const model of models) {
    if (!isInDevelopment(model)) continue
    model.developmentDaysRemaining = (model.developmentDaysRemaining ?? 0) - 1
    if (model.developmentDaysRemaining <= 0) {
      model.developmentDaysRemaining = 0
      released.push(model)
    }
  }
  return released
}
