import {
  GLOBAL_GOALS,
  HQ_REGIONS,
  LOGO_FORM_COUNT,
  LOGO_SYMBOL_COUNT,
  OCCUPATIONS,
  type GlobalGoalId,
  type HqRegionDefinition,
  type OccupationDefinition,
  type OccupationId,
} from '../data/foundation'
import { createRng } from './prng'
import type { CarClass } from './vehicles'

/** What the player picked on the setup screens when founding the company. Saved with the game. */
export interface LogoChoice {
  /** 0-based index into LOGO_SYMBOLS. */
  symbol: number
  /** 0-based index of the badge shape. */
  form: number
  /** Colours as a hue in degrees, 0-360. */
  symbolHue: number
  formHue: number
}

export interface FounderProfile {
  logo: LogoChoice
  hqId: string
  goalId: GlobalGoalId
  occupationId: OccupationId
}

export const DEFAULT_FOUNDER: FounderProfile = {
  logo: { symbol: 0, form: 0, symbolHue: 40, formHue: 220 },
  hqId: 'usa',
  goalId: 'wealth',
  occupationId: 'businessman',
}

export function hqRegion(id: string | undefined): HqRegionDefinition | undefined {
  return HQ_REGIONS.find((r) => r.id === id)
}

/** The home city a founder's HQ choice gives the company. */
export function hqCity(founder: FounderProfile | undefined): string | undefined {
  return hqRegion(founder?.hqId)?.city
}

export function occupation(id: string | undefined): OccupationDefinition | undefined {
  return OCCUPATIONS.find((o) => o.id === id)
}

export function goalDefinition(id: string | undefined) {
  return GLOBAL_GOALS.find((g) => g.id === id)
}

/** The part of a car's build cost that is the engine - roughly what the horsepower costs. */
function engineShare(unitCost: number, powerHp: number): number {
  return Math.min(unitCost * 0.85, Math.max(0, powerHp) * 21)
}

/** How much of its normal build cost a car costs from the chosen HQ (1 = no change). */
export function hqCostMultiplier(
  founder: FounderProfile | undefined,
  car: { carClass: CarClass | undefined; unitCost: number; powerHp: number },
): number {
  const region = hqRegion(founder?.hqId)
  if (!region) return 1
  let multiplier = region.allCostMultiplier ?? 1
  if (region.classCostMultiplier && car.carClass && region.classCostMultiplier.classes.includes(car.carClass)) {
    multiplier *= region.classCostMultiplier.multiplier
  }
  if (region.engineCostMultiplier && car.unitCost > 0) {
    const share = engineShare(car.unitCost, car.powerHp) / car.unitCost
    multiplier *= 1 - share * (1 - region.engineCostMultiplier)
  }
  return multiplier
}

/** Class-by-class demand boosts from the chosen HQ. */
export function hqClassDemand(founder: FounderProfile | undefined): Partial<Record<CarClass, number>> {
  return hqRegion(founder?.hqId)?.classDemandMultiplier ?? {}
}

export function marketingDiscountFromFounder(founder: FounderProfile | undefined): number {
  return occupation(founder?.occupationId)?.marketingDiscountPercent ?? 0
}

export function startingCapitalFor(base: number, founder: FounderProfile | undefined): number {
  return Math.round(base * (1 + (occupation(founder?.occupationId)?.startingCapitalBonus ?? 0)))
}

export function startingResearchPointsFor(base: number, founder: FounderProfile | undefined): number {
  return base + (occupation(founder?.occupationId)?.startingResearchPoints ?? 0)
}

/** New fans from selling cars: one fan per car, a little more with a good reputation. */
export function fansFromSales(units: number, reputationPercent: number, founder: FounderProfile | undefined): number {
  const bonus = occupation(founder?.occupationId)?.fanBonus ?? 0
  return units * (1 + reputationPercent / 100) * (1 + bonus)
}

const NAME_FIRST = ['Westwell', 'Northgate', 'Silverline', 'Redwood', 'Ironbridge', 'Falcon', 'Harbor', 'Summit', 'Crown', 'Blue Ridge', 'Meridian', 'Ashford', 'Stonehaven', 'Eastport', 'Lakeside', 'Goldcrest']
const NAME_LAST = ['Motors', 'Automotive', 'Car Company', 'Auto Works', 'Vehicles', 'Engineering', 'Motor Works', 'Cars']

/** A made-up company name for the "Suggest something" button. */
export function suggestCompanyName(seed: number): string {
  const rng = createRng(seed)
  return `${NAME_FIRST[Math.floor(rng() * NAME_FIRST.length)]} ${NAME_LAST[Math.floor(rng() * NAME_LAST.length)]}`
}

/** A random logo for the "Suggest something" button. */
export function suggestLogo(seed: number): LogoChoice {
  const rng = createRng(seed)
  return {
    symbol: Math.floor(rng() * LOGO_SYMBOL_COUNT),
    form: Math.floor(rng() * LOGO_FORM_COUNT),
    symbolHue: Math.floor(rng() * 360),
    formHue: Math.floor(rng() * 360),
  }
}
