import type { GameDate } from './gameDate'
import type { CarClass, CarModel } from './vehicles'

/** A rule that keeps hurting certain cars' sales once it's in force (emission limits, safety laws). */
export type RegulationRule =
  | { kind: 'emissionsAbove'; limitGKm: number; salesMultiplier: number }
  | { kind: 'noAirbags'; salesMultiplier: number }
  | { kind: 'fuelType'; fuelType: CarModel['engine']['fuelType']; salesMultiplier: number }

/** A real piece of automotive history (oil crises, recessions, new laws, booms). Active from its
 * start month for durationMonths, or forever when durationMonths is omitted. Effects multiply. */
export interface HistoryEventDefinition {
  id: string
  year: number
  month: number
  durationMonths?: number
  /** Multiplies how many cars people buy overall. */
  demandMultiplier?: number
  /** Multiplies how much buyers care about fuel economy / power. */
  fuelEconomyWeightMultiplier?: number
  powerWeightMultiplier?: number
  classDemandMultiplier?: Partial<Record<CarClass, number>>
  /** Multiplies how many cars a production line builds per day (shortages, shutdowns). */
  productionSpeedMultiplier?: number
  /** Multiplies the cost of building each car (inflation, scarce parts). */
  productionCostMultiplier?: number
  regulation?: RegulationRule
}

const monthIndex = (year: number, month: number) => year * 12 + (month - 1)

export function isEventActive(event: HistoryEventDefinition, today: GameDate): boolean {
  const now = monthIndex(today.year, today.month)
  const start = monthIndex(event.year, event.month)
  if (now < start) return false
  return event.durationMonths === undefined || now < start + event.durationMonths
}

export function activeEvents(events: HistoryEventDefinition[], today: GameDate): HistoryEventDefinition[] {
  return events.filter((e) => isEventActive(e, today))
}

/** Events that start or end on this day (only ever the 1st of a month) - for the News feed. */
export function eventChangesToday(events: HistoryEventDefinition[], today: GameDate): { started: HistoryEventDefinition[]; ended: HistoryEventDefinition[] } {
  if (today.day !== 1) return { started: [], ended: [] }
  const now = monthIndex(today.year, today.month)
  return {
    started: events.filter((e) => monthIndex(e.year, e.month) === now),
    ended: events.filter((e) => e.durationMonths !== undefined && monthIndex(e.year, e.month) + e.durationMonths === now),
  }
}

/** Everything today's events add up to. */
export interface EventEffects {
  demandMultiplier: number
  fuelEconomyWeightMultiplier: number
  powerWeightMultiplier: number
  classDemandMultiplier: Partial<Record<CarClass, number>>
  productionSpeedMultiplier: number
  productionCostMultiplier: number
  /** Sales multiplier for one model from every regulation in force (1 = unaffected). */
  modelMultiplier: (model: CarModel) => number
}

export function combineEvents(events: HistoryEventDefinition[]): EventEffects {
  const effects: EventEffects = {
    demandMultiplier: 1,
    fuelEconomyWeightMultiplier: 1,
    powerWeightMultiplier: 1,
    classDemandMultiplier: {},
    productionSpeedMultiplier: 1,
    productionCostMultiplier: 1,
    modelMultiplier: () => 1,
  }
  const rules: RegulationRule[] = []
  for (const e of events) {
    effects.demandMultiplier *= e.demandMultiplier ?? 1
    effects.fuelEconomyWeightMultiplier *= e.fuelEconomyWeightMultiplier ?? 1
    effects.powerWeightMultiplier *= e.powerWeightMultiplier ?? 1
    effects.productionSpeedMultiplier *= e.productionSpeedMultiplier ?? 1
    effects.productionCostMultiplier *= e.productionCostMultiplier ?? 1
    for (const [carClass, m] of Object.entries(e.classDemandMultiplier ?? {}) as [CarClass, number][]) {
      effects.classDemandMultiplier[carClass] = (effects.classDemandMultiplier[carClass] ?? 1) * m
    }
    if (e.regulation) rules.push(e.regulation)
  }
  effects.modelMultiplier = (model) => rules.reduce((m, rule) => m * regulationMultiplier(rule, model), 1)
  return effects
}

export function regulationMultiplier(rule: RegulationRule, model: CarModel): number {
  switch (rule.kind) {
    case 'emissionsAbove':
      return model.stats.emissionsGKm > rule.limitGKm ? rule.salesMultiplier : 1
    case 'noAirbags':
      return (model.componentSelections.airbags ?? 'none') === 'none' ? rule.salesMultiplier : 1
    case 'fuelType':
      return model.engine.fuelType === rule.fuelType ? rule.salesMultiplier : 1
  }
}
