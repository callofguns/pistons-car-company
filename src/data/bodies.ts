import type { BodyStyleDefinition } from '../core/vehicles'

/** The 8 selectable body styles spread across the 5 car classes - same content as the Unity port's ContentGeneratorWindow.GenerateBodies(). */
export const BODIES: BodyStyleDefinition[] = [
  { id: 'classic-saloon', displayName: 'Classic Saloon', carClass: 'Sedan', engineBayCapacityLiters: 4.5, productionEquipmentCost: 145_000, baseUnitCost: 3200, baseWeightKg: 1150, unlockYear: 1960 },
  { id: 'executive-sedan', displayName: 'Executive Sedan', carClass: 'Sedan', engineBayCapacityLiters: 6, productionEquipmentCost: 210_000, baseUnitCost: 4400, baseWeightKg: 1350, unlockYear: 1978 },
  { id: 'trail-suv', displayName: 'Trail SUV', carClass: 'SUV', engineBayCapacityLiters: 6.5, productionEquipmentCost: 260_000, baseUnitCost: 5200, baseWeightKg: 1800, unlockYear: 1985 },
  { id: 'grand-suv', displayName: 'Grand SUV', carClass: 'SUV', engineBayCapacityLiters: 7, productionEquipmentCost: 320_000, baseUnitCost: 6600, baseWeightKg: 2100, unlockYear: 1995 },
  { id: 'roadster', displayName: 'Roadster', carClass: 'Sports', engineBayCapacityLiters: 5, productionEquipmentCost: 300_000, baseUnitCost: 6000, baseWeightKg: 1050, unlockYear: 1972 },
  { id: 'gt-coupe', displayName: 'GT Coupe', carClass: 'Coupe', engineBayCapacityLiters: 5.5, productionEquipmentCost: 240_000, baseUnitCost: 5000, baseWeightKg: 1250, unlockYear: 1974 },
  { id: 'compact-coupe', displayName: 'Compact Coupe', carClass: 'Coupe', engineBayCapacityLiters: 4, productionEquipmentCost: 160_000, baseUnitCost: 3400, baseWeightKg: 1050, unlockYear: 1965 },
  { id: 'pickup', displayName: 'Pickup', carClass: 'Truck', engineBayCapacityLiters: 6, productionEquipmentCost: 280_000, baseUnitCost: 5500, baseWeightKg: 2000, unlockYear: 1968 },
]
