import type { CarClass } from '../core/vehicles'

/** The world markets a new car can be sold in. Names and descriptions live in en.ts as
 * data.region.<id>.*. Ids are saved with each model - never rename them. */
export interface SalesRegionDefinition {
  id: string
  /** The share of the world's car buyers that live here (all regions add up to 1). */
  weight: number
  /** What it costs to open this region for one model. */
  fee: number
  /** Emission limits are this much of the world standard (smaller = stricter). */
  ecoStrictness: number
  /** How much more or less this region likes each kind of car. */
  classPreference: Partial<Record<CarClass, number>>
  /** Where the pin sits on the map, as a percentage of its width and height. */
  map: { x: number; y: number }
}

export const SALES_REGIONS: SalesRegionDefinition[] = [
  { id: 'north-america', weight: 0.27, fee: 75_000, ecoStrictness: 1.0, classPreference: { SUV: 1.4, Truck: 1.5, Sports: 1.1, Sedan: 0.9, Coupe: 1.0 }, map: { x: 23, y: 37 } },
  { id: 'europe', weight: 0.26, fee: 90_000, ecoStrictness: 0.85, classPreference: { Sedan: 1.2, Coupe: 1.1, Sports: 1.2, SUV: 0.8, Truck: 0.6 }, map: { x: 47, y: 34 } },
  { id: 'peoples-union', weight: 0.07, fee: 50_000, ecoStrictness: 1.4, classPreference: { Sedan: 1.3, Truck: 1.1, SUV: 0.7, Sports: 0.5, Coupe: 0.7 }, map: { x: 72, y: 26 } },
  { id: 'middle-east', weight: 0.05, fee: 40_000, ecoStrictness: 1.5, classPreference: { SUV: 1.4, Sports: 1.3, Sedan: 1.0, Truck: 0.8, Coupe: 0.9 }, map: { x: 60, y: 49 } },
  { id: 'asia', weight: 0.14, fee: 60_000, ecoStrictness: 1.1, classPreference: { Sedan: 1.2, Coupe: 1.0, SUV: 0.9, Truck: 0.8, Sports: 0.8 }, map: { x: 76, y: 52 } },
  { id: 'africa', weight: 0.04, fee: 25_000, ecoStrictness: 1.6, classPreference: { Truck: 1.4, SUV: 1.2, Sedan: 0.9, Sports: 0.3, Coupe: 0.5 }, map: { x: 51, y: 70 } },
  { id: 'latin-america', weight: 0.08, fee: 40_000, ecoStrictness: 1.35, classPreference: { Sedan: 1.2, Truck: 1.1, Coupe: 0.9, SUV: 0.9, Sports: 0.6 }, map: { x: 33, y: 75 } },
  { id: 'australia', weight: 0.09, fee: 45_000, ecoStrictness: 1.0, classPreference: { Truck: 1.3, SUV: 1.2, Sedan: 0.9, Sports: 0.9, Coupe: 0.9 }, map: { x: 79, y: 80 } },
]

export function findSalesRegion(id: string): SalesRegionDefinition | undefined {
  return SALES_REGIONS.find((r) => r.id === id)
}
