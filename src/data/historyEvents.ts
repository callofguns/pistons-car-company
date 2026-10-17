import type { HistoryEventDefinition } from '../core/events'

/** Real automotive history from 1970 on, in date order. Names and descriptions live in en.ts as
 * data.historyEvent.<id>.name / .description. Ids are fixed (News entries store them). */
export const HISTORY_EVENTS: HistoryEventDefinition[] = [
  // OPEC oil embargo: petrol queues, buyers want small thrifty cars.
  { id: 'oil-crisis-1973', year: 1973, month: 10, durationMonths: 18, demandMultiplier: 0.8, fuelEconomyWeightMultiplier: 2.5, powerWeightMultiplier: 0.6 },
  // US Clean Air Act limits arrive with catalytic converters.
  { id: 'clean-air-1975', year: 1975, month: 1, regulation: { kind: 'emissionsAbove', limitGKm: 650, salesMultiplier: 0.6 } },
  // Fuel economy standards (CAFE) - economy matters a bit more for good.
  { id: 'cafe-1978', year: 1978, month: 1, fuelEconomyWeightMultiplier: 1.3 },
  // Iranian revolution doubles oil prices.
  { id: 'oil-crisis-1979', year: 1979, month: 4, durationMonths: 18, demandMultiplier: 0.85, fuelEconomyWeightMultiplier: 2.2, powerWeightMultiplier: 0.7 },
  // Early-80s recession with very high interest rates.
  { id: 'recession-1980', year: 1980, month: 7, durationMonths: 28, demandMultiplier: 0.8, productionCostMultiplier: 1.1 },
  // Oil glut: petrol is cheap again, power comes back into fashion.
  { id: 'oil-glut-1986', year: 1986, month: 1, durationMonths: 24, demandMultiplier: 1.1, fuelEconomyWeightMultiplier: 0.7, powerWeightMultiplier: 1.3 },
  // Gulf War oil shock and the early-90s recession.
  { id: 'gulf-war-1990', year: 1990, month: 8, durationMonths: 12, demandMultiplier: 0.85, fuelEconomyWeightMultiplier: 1.6 },
  // Euro 1 emission standard - tighter limits.
  { id: 'euro-1-1993', year: 1993, month: 1, regulation: { kind: 'emissionsAbove', limitGKm: 450, salesMultiplier: 0.7 } },
  // The SUV and pickup boom.
  { id: 'suv-boom-1995', year: 1995, month: 1, durationMonths: 150, classDemandMultiplier: { SUV: 1.5, Truck: 1.25 } },
  // Dual front airbags required in every new car.
  { id: 'airbag-law-1998', year: 1998, month: 9, regulation: { kind: 'noAirbags', salesMultiplier: 0.4 } },
  // Dot-com bust.
  { id: 'recession-2001', year: 2001, month: 3, durationMonths: 8, demandMultiplier: 0.9 },
  // Record oil prices.
  { id: 'oil-spike-2007', year: 2007, month: 6, durationMonths: 14, fuelEconomyWeightMultiplier: 1.8, powerWeightMultiplier: 0.8 },
  // The Great Recession - the worst car market in decades.
  { id: 'great-recession-2008', year: 2008, month: 9, durationMonths: 20, demandMultiplier: 0.65, classDemandMultiplier: { SUV: 0.8, Truck: 0.85 } },
  // Euro 5 emission standard.
  { id: 'euro-5-2009', year: 2009, month: 9, regulation: { kind: 'emissionsAbove', limitGKm: 350, salesMultiplier: 0.7 } },
  // "Cash for Clunkers" scrappage scheme - a short, sharp buying spree.
  { id: 'scrappage-2009', year: 2009, month: 7, durationMonths: 2, demandMultiplier: 1.4, fuelEconomyWeightMultiplier: 1.5 },
  // Buyers start getting interested in electric cars.
  { id: 'ev-interest-2012', year: 2012, month: 1, regulation: { kind: 'fuelType', fuelType: 'Electric', salesMultiplier: 1.4 } },
  // Dieselgate: diesel cars fall out of favour.
  { id: 'dieselgate-2015', year: 2015, month: 9, regulation: { kind: 'fuelType', fuelType: 'Diesel', salesMultiplier: 0.65 } },
  // COVID-19: showrooms and factories close.
  { id: 'pandemic-2020', year: 2020, month: 3, durationMonths: 3, demandMultiplier: 0.5, productionSpeedMultiplier: 0.5 },
  // Global chip shortage: factories can't get enough parts.
  { id: 'chip-shortage-2021', year: 2021, month: 1, durationMonths: 24, productionSpeedMultiplier: 0.6, productionCostMultiplier: 1.15, demandMultiplier: 1.1 },
]
