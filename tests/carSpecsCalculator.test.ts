import { describe, expect, it } from 'vitest'
import { calculateCarSpecs } from '../src/core/carSpecsCalculator'
import { TechModifiers } from '../src/core/techModifiers'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import type { BodyStyleDefinition } from '../src/core/vehicles'

const body: BodyStyleDefinition = {
  id: 'test-body',
  displayName: 'Test Body',
  carClass: 'Sedan',
  engineBayCapacityLiters: 6,
  baseWeightKg: 1200,
  productionEquipmentCost: 0,
  baseUnitCost: 3000,
  unlockYear: 1950,
}

describe('calculateCarSpecs', () => {
  it('is deterministic for identical inputs', () => {
    const tech = new TechModifiers()
    const a = calculateCarSpecs(body, DEFAULT_ENGINE_SPEC, tech)
    const b = calculateCarSpecs(body, DEFAULT_ENGINE_SPEC, tech)
    expect(a).toEqual(b)
  })

  it('more displacement produces more power', () => {
    const tech = new TechModifiers()
    const small = calculateCarSpecs(body, { ...DEFAULT_ENGINE_SPEC, displacementLiters: 1.5, cylinders: 4 }, tech)
    const large = calculateCarSpecs(body, { ...DEFAULT_ENGINE_SPEC, displacementLiters: 4, cylinders: 4 }, tech)
    expect(large.powerHp).toBeGreaterThan(small.powerHp)
  })

  it('turbocharged outperforms naturally aspirated', () => {
    const tech = new TechModifiers()
    const na = calculateCarSpecs(body, { ...DEFAULT_ENGINE_SPEC, aspiration: 'NaturallyAspirated' }, tech)
    const turbo = calculateCarSpecs(body, { ...DEFAULT_ENGINE_SPEC, aspiration: 'Turbocharged' }, tech)
    expect(turbo.powerHp).toBeGreaterThan(na.powerHp)
  })

  it('power research increases power over baseline', () => {
    const baseline = calculateCarSpecs(body, DEFAULT_ENGINE_SPEC, new TechModifiers())

    const boosted = new TechModifiers()
    boosted.apply([{ target: 'Power', amount: 0.1 }])
    const withResearch = calculateCarSpecs(body, DEFAULT_ENGINE_SPEC, boosted)

    expect(withResearch.powerHp).toBeGreaterThan(baseline.powerHp)
  })
})
