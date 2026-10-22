import { SALES_REGIONS, findSalesRegion, type SalesRegionDefinition } from '../data/salesRegions'
import type { CarClass } from './vehicles'

/** The world emission limit in grams of CO2 per km for a new car in a year. */
export function worldEmissionLimit(year: number): number {
  if (year < 1975) return 999
  if (year < 1985) return 520
  if (year < 1995) return 400
  if (year < 2005) return 330
  if (year < 2015) return 260
  return 220
}

/** What this region allows for a new car in a year (a stricter region has a lower limit). */
export function regionEmissionLimit(region: SalesRegionDefinition, year: number): number {
  const base = worldEmissionLimit(year)
  return base >= 999 ? 999 : Math.round(base * region.ecoStrictness)
}

export function passesEmissions(region: SalesRegionDefinition, emissionsGKm: number, year: number): boolean {
  return emissionsGKm <= regionEmissionLimit(region, year)
}

export function regionFees(regionIds: string[]): number {
  return regionIds.reduce((sum, id) => sum + (findSalesRegion(id)?.fee ?? 0), 0)
}

const preference = (region: SalesRegionDefinition, carClass: CarClass | undefined) =>
  carClass ? region.classPreference[carClass] ?? 1 : 1

/** The share of a car's normal sales that the chosen regions bring: the buyers in each chosen
 * region the car still passes the emission rules for, weighted by how much that region likes this
 * kind of car, out of the same sum for the whole world. A car with no choice stored (older saves)
 * sells everywhere as before. */
export function regionDemandFactor(
  regionIds: string[] | undefined,
  carClass: CarClass | undefined,
  emissionsGKm: number,
  year: number,
): number {
  if (!regionIds) return 1
  const total = SALES_REGIONS.reduce((sum, r) => sum + r.weight * preference(r, carClass), 0)
  const open = regionIds
    .map((id) => findSalesRegion(id))
    .filter((r): r is SalesRegionDefinition => r !== undefined && passesEmissions(r, emissionsGKm, year))
    .reduce((sum, r) => sum + r.weight * preference(r, carClass), 0)
  return total > 0 ? open / total : 1
}
