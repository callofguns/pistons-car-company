import { describe, expect, it } from 'vitest'
import {
  BUILD_SLOT_IDS,
  buildLiters,
  buildOptions,
  clampBuild,
  computeEngineStats,
  defaultBuild,
  displacementLiters,
  engineLimits,
  specOfBuild,
  type EngineBuild,
} from '../src/core/engineBuilder'
import { unlockedByYear } from '../src/core/unlocks'
import { TechModifiers } from '../src/core/techModifiers'
import {
  applyEngineBuild,
  beginNewDesign,
  createVehicleState,
  deleteEngine,
  finalizeDesign,
  previewCurrentStats,
  saveEngine,
  selectBody,
  setNameAndCategory,
} from '../src/core/vehicleService'
import { BODIES } from '../src/data/bodies'
import { DESIGN_STEPS } from '../src/data/designSteps'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { makeDate } from '../src/core/gameDate'
import { en } from '../src/i18n/locales/en'

const tech = new TechModifiers()
const limits1970 = engineLimits(unlockedByYear(1970), 6.8)

function build(patch: Partial<EngineBuild> = {}, parts: Record<string, string> = {}): EngineBuild {
  const base = defaultBuild('e1')
  return { ...base, ...patch, parts: { ...base.parts, ...parts } }
}

describe('engine size', () => {
  it('works out litres from cylinders, bore and stroke', () => {
    expect(displacementLiters(3, 70, 60)).toBeCloseTo(0.69, 2)
    expect(displacementLiters(4, 86, 86)).toBeCloseTo(2.0, 1)
  })
})

describe('limits from research', () => {
  it('start with the engines already known in 1970, and grow with research', () => {
    expect(limits1970.cylinderOptions).toEqual([3, 4, 5, 6, 8])
    expect(limits1970.maxLiters).toBeCloseTo(5, 1)
    expect(limits1970.diesel).toBe(true)
    expect(limits1970.electric).toBe(false)
    const later = engineLimits(unlockedByYear(2010), 9)
    expect(later.cylinderOptions).toContain(12)
    expect(later.electric).toBe(true)
  })

  it('the body engine bay caps the size', () => {
    expect(engineLimits(unlockedByYear(2010), 2.5).maxLiters).toBe(2.5)
  })

  it('clamps too many cylinders and too big an engine', () => {
    const big = clampBuild(build({ cylinders: 12, boreMm: 110, strokeMm: 110 }), limits1970)
    expect(big.cylinders).toBe(8)
    expect(buildLiters(big)).toBeLessThanOrEqual(limits1970.maxLiters + 0.0001)
    expect(clampBuild(build({ fuel: 'electric' }), limits1970).fuel).toBe('regular')
  })
})

describe('engine stats', () => {
  it('a bigger engine makes more power and weighs more', () => {
    const small = computeEngineStats(build({ boreMm: 70, strokeMm: 70 }), tech)
    const large = computeEngineStats(build({ cylinders: 8, boreMm: 90, strokeMm: 80 }), tech)
    expect(large.powerHp).toBeGreaterThan(small.powerHp)
    expect(large.weightKg).toBeGreaterThan(small.weightKg)
    expect(large.costPrice).toBeGreaterThan(small.costPrice)
  })

  it('a turbocharger adds power, and the boost setup only counts with one fitted', () => {
    const plain = build({}, { 'turbo-setup': 'high' })
    const turbo = build({}, { 'forced-induction': 'turbocharger', 'turbo-setup': 'high' })
    const mild = build({}, { 'forced-induction': 'turbocharger', 'turbo-setup': 'low' })
    expect(buildOptions(plain).some((o) => o.id === 'high')).toBe(false)
    expect(computeEngineStats(turbo, tech).powerHp).toBeGreaterThan(computeEngineStats(mild, tech).powerHp)
    expect(computeEngineStats(mild, tech).powerHp).toBeGreaterThan(computeEngineStats(plain, tech).powerHp)
  })

  it('a higher rev limit gives power but costs reliability', () => {
    const calm = computeEngineStats(build({ rpmLimit: 5000 }), tech)
    const wild = computeEngineStats(build({ rpmLimit: 8000 }), tech)
    expect(wild.powerHp).toBeGreaterThan(calm.powerHp)
    expect(wild.reliabilityPercent).toBeLessThan(calm.reliabilityPercent)
    expect(wild.maxRpm).toBeGreaterThan(calm.maxRpm)
  })

  it('an electric engine ignores the parts', () => {
    expect(specOfBuild(build({ fuel: 'electric' })).fuelType).toBe('Electric')
    expect(buildOptions(build({ fuel: 'electric' }))).toEqual([])
  })
})

describe('parts data', () => {
  it('every builder slot exists and has text', () => {
    for (const slotId of BUILD_SLOT_IDS) {
      const slot = DESIGN_STEPS.flatMap((s) => s.slots).find((s) => s.id === slotId)
      expect(slot, slotId).toBeTruthy()
      expect(en[`data.designSlot.${slotId}.label` as keyof typeof en]).toBeTruthy()
    }
  })
})

describe('engine library and cars', () => {
  const body = BODIES.find((b) => b.id === 'classic-saloon')!

  it('saves, replaces and deletes engines', () => {
    const vehicles = createVehicleState()
    saveEngine(vehicles, build())
    saveEngine(vehicles, { ...build(), name: 'Renamed' })
    expect(vehicles.engines).toHaveLength(1)
    expect(vehicles.engines[0].name).toBe('Renamed')
    deleteEngine(vehicles, 'e1')
    expect(vehicles.engines).toHaveLength(0)
  })

  it('a car built on a custom engine gets that engines power and remembers it', () => {
    const vehicles = createVehicleState()
    beginNewDesign(vehicles)
    selectBody(vehicles, body, createBank(1e9), createLedgerState(), unlockedByYear(1970), makeDate(1970, 1, 1))
    const weak = build({ boreMm: 66, strokeMm: 66 })
    const strong = build({ cylinders: 6, boreMm: 84, strokeMm: 80 }, { 'valves': 'v3' })
    applyEngineBuild(vehicles, weak)
    const weakStats = previewCurrentStats(vehicles, BODIES, tech)!
    applyEngineBuild(vehicles, strong)
    const strongStats = previewCurrentStats(vehicles, BODIES, tech)!
    expect(strongStats.powerHp).toBeGreaterThan(weakStats.powerHp)
    expect(vehicles.currentSession!.engine.cylinders).toBe(6)

    setNameAndCategory(vehicles, 'Test', 'X')
    const model = finalizeDesign(vehicles, BODIES, tech, makeDate(1970, 1, 1))
    expect(model?.engineBuild?.cylinders).toBe(6)
  })
})
