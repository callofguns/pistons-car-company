import type { TechModifiers } from './techModifiers'
import type { BodyStyleDefinition, CarPerformanceStats, EngineSpec, Aspiration } from './vehicles'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const inverseLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a), 0, 1)

/**
 * Pure, deterministic derivation of every stat on the Model Lineup spec sheet from a body and an
 * engine spec, modified by accumulated research. No side effects, no randomness - same inputs
 * always produce the same outputs. Direct port of CarSpecsCalculator.cs.
 */
export function calculateCarSpecs(
  body: BodyStyleDefinition,
  engine: EngineSpec,
  tech: TechModifiers,
): CarPerformanceStats {
  const aspirationPowerMul = aspirationPowerMultiplier(engine.aspiration)
  const powerMul = 1 + tech.get('Power')
  const reliabilityBonus = tech.get('Reliability')
  const fuelEconomyBonus = tech.get('FuelEconomy')
  const emissionsCut = tech.get('Emissions')
  const costCut = tech.get('ProductionCost')
  const repairCut = tech.get('RepairCost')

  const powerHp = engine.displacementLiters * 55 * cylinderEfficiency(engine.cylinders) * aspirationPowerMul * powerMul
  const torqueNm = powerHp * 1.35 * (engine.fuelType === 'Diesel' ? 1.15 : 1)
  const torqueRpm = clamp(4800 - engine.cylinders * 120, 1800, 5200)

  const weightKg = body.baseWeightKg + engine.cylinders * 22 + engine.displacementLiters * 45

  const fuelConsumption = Math.max(
    3,
    (engine.fuelType === 'Electric' ? 0 : 4.2 + engine.displacementLiters * 1.35) * (1 - fuelEconomyBonus),
  )

  const reliability = clamp(
    96 - engine.cylinders * 1.4 - (engine.aspiration !== 'NaturallyAspirated' ? 5 : 0) + reliabilityBonus * 100,
    25,
    99,
  )

  const emissions =
    engine.fuelType === 'Electric' ? 0 : Math.max(40, (110 + engine.displacementLiters * 170) * (1 - emissionsCut))

  const repairCost = Math.max(
    150,
    (500 + powerHp * 3.1 + (engine.aspiration !== 'NaturallyAspirated' ? 300 : 0)) * (1 - repairCut),
  )

  const maxRpm = clamp(6400 - engine.cylinders * 160 + (engine.aspiration === 'Turbocharged' ? 300 : 0), 4500, 9000)

  const powerToWeight = powerHp / Math.max(weightKg, 1)
  const zeroToHundred = clamp(17.5 - powerToWeight * 155, 3.2, 22)
  const topSpeed = clamp(95 + powerHp * 0.34 - weightKg * 0.011, 90, 400)

  const unitCost = Math.max(
    500,
    (body.baseUnitCost + powerHp * 21 + (engine.aspiration !== 'NaturallyAspirated' ? 1200 : 0)) * (1 - costCut),
  )
  const suggestedPrice = unitCost * 2.4

  const rating = computeRating(powerHp, reliability, fuelConsumption, zeroToHundred)

  return {
    powerHp,
    torqueNm,
    torqueRpm,
    fuelConsumptionL100Km: fuelConsumption,
    reliabilityPercent: reliability,
    emissionsGKm: emissions,
    repairCost,
    weightKg,
    maxRpm,
    zeroToHundredSec: zeroToHundred,
    topSpeedKph: topSpeed,
    rating,
    unitCost,
    suggestedPrice,
  }
}

function aspirationPowerMultiplier(aspiration: Aspiration): number {
  switch (aspiration) {
    case 'Turbocharged':
      return 1.28
    case 'Supercharged':
      return 1.22
    default:
      return 1
  }
}

// More cylinders spread the same displacement more efficiently, with diminishing returns.
function cylinderEfficiency(cylinders: number): number {
  return 1 + clamp(cylinders - 4, 0, 8) * 0.03
}

function computeRating(powerHp: number, reliability: number, fuelConsumption: number, zeroToHundred: number): number {
  const powerScore = inverseLerp(60, 500, powerHp)
  const reliabilityScore = inverseLerp(25, 99, reliability)
  const economyScore = 1 - inverseLerp(4, 20, fuelConsumption)
  const accelScore = 1 - inverseLerp(3.2, 18, zeroToHundred)

  const composite = powerScore * 0.35 + reliabilityScore * 0.3 + economyScore * 0.15 + accelScore * 0.2
  return clamp(Math.round(composite * 10), 1, 10)
}
