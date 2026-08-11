import type { EngineSpec } from '../core/vehicles'

/** A ready-to-install engine the player picks from a carousel - the "preset engine picker" scope
 * decision in place of the reference's nested Engine Block/Pistons/Fuel System/Turbo/Exhaust
 * sub-wizard. unitCost/stats still derive purely from `spec` via calculateCarSpecs, same as
 * today's engine designer - a preset is just a named, curated EngineSpec. */
export interface EnginePresetDefinition {
  id: string
  name: string
  unlockYear: number
  spec: EngineSpec
}

export const ENGINE_PRESETS: EnginePresetDefinition[] = [
  { id: 'economy-i3', name: 'Economy I3 1.0L', unlockYear: 1950, spec: { displacementLiters: 1.0, cylinders: 3, aspiration: 'NaturallyAspirated', fuelType: 'Petrol', valveCount: 6 } },
  { id: 'standard-i4', name: 'Standard I4 1.6L', unlockYear: 1950, spec: { displacementLiters: 1.6, cylinders: 4, aspiration: 'NaturallyAspirated', fuelType: 'Petrol', valveCount: 8 } },
  { id: 'diesel-i4', name: 'Diesel I4 2.2L', unlockYear: 1955, spec: { displacementLiters: 2.2, cylinders: 4, aspiration: 'NaturallyAspirated', fuelType: 'Diesel', valveCount: 8 } },
  { id: 'performance-v6', name: 'Performance V6 3.0L', unlockYear: 1965, spec: { displacementLiters: 3.0, cylinders: 6, aspiration: 'NaturallyAspirated', fuelType: 'Petrol', valveCount: 24 } },
  { id: 'muscle-v8', name: 'Muscle V8 5.0L', unlockYear: 1968, spec: { displacementLiters: 5.0, cylinders: 8, aspiration: 'NaturallyAspirated', fuelType: 'Petrol', valveCount: 16 } },
  { id: 'sport-turbo-i4', name: 'Sport Turbo I4 2.0L', unlockYear: 1975, spec: { displacementLiters: 2.0, cylinders: 4, aspiration: 'Turbocharged', fuelType: 'Petrol', valveCount: 16 } },
  { id: 'rally-turbo-i4', name: 'Rally Turbo I4 2.2L', unlockYear: 1980, spec: { displacementLiters: 2.2, cylinders: 4, aspiration: 'Turbocharged', fuelType: 'Petrol', valveCount: 16 } },
  { id: 'electric-drive', name: 'Electric Drive Unit', unlockYear: 2005, spec: { displacementLiters: 0.3, cylinders: 0, aspiration: 'NaturallyAspirated', fuelType: 'Electric', valveCount: 0 } },
]

export function findEnginePreset(id: string): EnginePresetDefinition | undefined {
  return ENGINE_PRESETS.find((p) => p.id === id)
}
