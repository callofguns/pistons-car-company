import type { TechModifiers } from './techModifiers'
import type { BodyStyleDefinition, CarPerformanceStats, EngineSpec, Aspiration } from './vehicles'
import { computeDesignStats, designFitPercent } from './designStats'
import type { ComponentOption } from '../data/designSteps'
import type { ClassificationTagDefinition } from '../data/classifications'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const inverseLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a), 0, 1)

/** The design wizard's component/classification choices, resolved from ids to definitions -
 * optional so every existing call site (and the carSpecsCalculator tests) keeps working unchanged
 * for a body+engine-only preview with no components chosen yet. */
export interface DesignChoices {
  componentOptions: ComponentOption[]
  classificationTags: ClassificationTagDefinition[]
}

const NO_DESIGN_CHOICES: DesignChoices = { componentOptions: [], classificationTags: [] }

/**
 * Pure, deterministic derivation of every stat on the Model Lineup spec sheet from a body and an
 * engine spec, modified by accumulated research and the design wizard's component/classification
 * choices. No side effects, no randomness - same inputs always produce the same outputs. Direct
 * port of CarSpecsCalculator.cs, extended with the design-wizard component system.
 */
export function calculateCarSpecs(
  body: BodyStyleDefinition,
  engine: EngineSpec,
  tech: TechModifiers,
  designChoices: DesignChoices = NO_DESIGN_CHOICES,
): CarPerformanceStats {
  const { componentOptions, classificationTags } = designChoices
  const tuning = componentOptions.reduce(
    (sum, o) => ({
      powerPct: sum.powerPct + (o.engine?.powerPct ?? 0),
      torquePct: sum.torquePct + (o.engine?.torquePct ?? 0),
      reliability: sum.reliability + (o.engine?.reliability ?? 0),
      fuelPct: sum.fuelPct + (o.engine?.fuelPct ?? 0),
      emissionsPct: sum.emissionsPct + (o.engine?.emissionsPct ?? 0),
      maxRpm: sum.maxRpm + (o.engine?.maxRpm ?? 0),
    }),
    { powerPct: 0, torquePct: 0, reliability: 0, fuelPct: 0, emissionsPct: 0, maxRpm: 0 },
  )
  // A forced-induction option replaces the engine preset's own aspiration.
  const aspiration = componentOptions.find((o) => o.engine?.aspiration)?.engine?.aspiration ?? engine.aspiration
  const aspirationPowerMul = aspirationPowerMultiplier(aspiration)
  const powerMul = 1 + tech.get('Power')
  const reliabilityBonus = tech.get('Reliability')
  const fuelEconomyBonus = tech.get('FuelEconomy')
  const emissionsCut = tech.get('Emissions')
  const costCut = tech.get('ProductionCost')
  const repairCut = tech.get('RepairCost')

  const componentWeightDeltaKg = componentOptions.reduce((sum, o) => sum + o.weightDeltaKg, 0)
  const componentCostDelta = componentOptions.reduce((sum, o) => sum + o.costDelta, 0)

  const powerHp = engine.displacementLiters * 55 * cylinderEfficiency(engine.cylinders) * aspirationPowerMul * powerMul * (1 + tuning.powerPct)
  const torqueNm = powerHp * 1.35 * (engine.fuelType === 'Diesel' ? 1.15 : 1) * (1 + tuning.torquePct)
  const torqueRpm = clamp(4800 - engine.cylinders * 120, 1800, 5200)

  const weightKg = Math.max(400, body.baseWeightKg + engine.cylinders * 22 + engine.displacementLiters * 45 + componentWeightDeltaKg)

  const fuelConsumption = Math.max(
    3,
    (engine.fuelType === 'Electric' ? 0 : 4.2 + engine.displacementLiters * 1.35) * (1 - fuelEconomyBonus) * (1 + tuning.fuelPct),
  )

  const reliability = clamp(
    96 - engine.cylinders * 1.4 - (aspiration !== 'NaturallyAspirated' ? 5 : 0) + reliabilityBonus * 100 + tuning.reliability,
    25,
    99,
  )

  const emissions =
    engine.fuelType === 'Electric' ? 0 : Math.max(40, (110 + engine.displacementLiters * 170) * (1 - emissionsCut) * (1 + tuning.emissionsPct))

  const repairCost = Math.max(
    150,
    (500 + powerHp * 3.1 + (aspiration !== 'NaturallyAspirated' ? 300 : 0)) * (1 - repairCut),
  )

  const maxRpm = clamp(6400 - engine.cylinders * 160 + (aspiration === 'Turbocharged' ? 300 : 0) + tuning.maxRpm, 4500, 9000)

  const powerToWeight = powerHp / Math.max(weightKg, 1)
  const zeroToHundred = clamp(17.5 - powerToWeight * 155, 3.2, 22)
  const topSpeed = clamp(95 + powerHp * 0.34 - weightKg * 0.011, 90, 400)

  const unitCost = Math.max(
    500,
    (body.baseUnitCost + powerHp * 21 + (aspiration !== 'NaturallyAspirated' ? 1200 : 0)) * (1 - costCut) +
      componentCostDelta,
  )

  const designStats = computeDesignStats(componentOptions.map((o) => o.effects))
  const fitPercent = designFitPercent(designStats, classificationTags)
  const tagPriceMultiplier =
    classificationTags.length === 0
      ? 1
      : classificationTags.reduce((sum, t) => sum + t.priceMultiplier, 0) / classificationTags.length
  // A design that matches its own classification tags earns the full tag-adjusted price; one that
  // misses badly still keeps 70% of it - fit shapes price, it doesn't gate the design entirely.
  // ~45% markup over cost for a mid-market design - real carmakers work on thin margins, so the
  // money comes from volume.
  const suggestedPrice = unitCost * 1.3 * tagPriceMultiplier * (0.7 + 0.3 * (fitPercent / 100))

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
    designStats,
    designFitPercent: fitPercent,
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

/** A convertible costs more to build and tool, weighs a little more, is less safe and better looking. */
export const CONVERTIBLE = { unitCostMultiplier: 1.08, toolingMultiplier: 1.15, extraWeightKg: 60, safety: -6, attractiveness: 8 }

/** The same stats for the roof-off version of a design. */
export function applyConvertible(stats: CarPerformanceStats): CarPerformanceStats {
  const keep = (v: number) => clamp(v, 0, 100)
  return {
    ...stats,
    unitCost: stats.unitCost * CONVERTIBLE.unitCostMultiplier,
    suggestedPrice: stats.suggestedPrice * CONVERTIBLE.unitCostMultiplier * 1.05,
    weightKg: stats.weightKg + CONVERTIBLE.extraWeightKg,
    designStats: {
      ...stats.designStats,
      safety: keep(stats.designStats.safety + CONVERTIBLE.safety),
      attractiveness: keep(stats.designStats.attractiveness + CONVERTIBLE.attractiveness),
    },
  }
}
