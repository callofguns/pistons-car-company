import type { MarketSegmentDefinition } from '../core/market'

/** The 5 buyer segments - same content as ContentGeneratorWindow.GenerateMarketSegments(). */
export const MARKET_SEGMENTS: MarketSegmentDefinition[] = [
  { id: 'economy', displayName: 'Economy', preferredClass: 'Sedan', weightPower: 0.1, weightReliability: 0.35, weightFuelEconomy: 0.4, weightPrice: 0.15, populationShare: 0.3, expectedPrice: 9_000, baseDemandPerDay: 55 },
  { id: 'family', displayName: 'Family', preferredClass: 'SUV', weightPower: 0.2, weightReliability: 0.35, weightFuelEconomy: 0.25, weightPrice: 0.2, populationShare: 0.25, expectedPrice: 16_000, baseDemandPerDay: 45 },
  { id: 'luxury', displayName: 'Luxury', preferredClass: 'Sedan', weightPower: 0.3, weightReliability: 0.3, weightFuelEconomy: 0.1, weightPrice: 0.3, populationShare: 0.15, expectedPrice: 32_000, baseDemandPerDay: 25 },
  { id: 'sports', displayName: 'Sports', preferredClass: 'Sports', weightPower: 0.55, weightReliability: 0.15, weightFuelEconomy: 0.05, weightPrice: 0.25, populationShare: 0.15, expectedPrice: 28_000, baseDemandPerDay: 20 },
  { id: 'utility', displayName: 'Utility', preferredClass: 'Truck', weightPower: 0.25, weightReliability: 0.4, weightFuelEconomy: 0.15, weightPrice: 0.2, populationShare: 0.15, expectedPrice: 18_000, baseDemandPerDay: 30 },
]
