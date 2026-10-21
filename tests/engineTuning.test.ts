import { describe, expect, it } from 'vitest'
import { calculateCarSpecs } from '../src/core/carSpecsCalculator'
import { TechModifiers } from '../src/core/techModifiers'
import { BODIES } from '../src/data/bodies'
import { DESIGN_STEPS } from '../src/data/designSteps'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'

const option = (slotId: string, optionId: string) => {
  for (const step of DESIGN_STEPS) for (const slot of step.slots) if (slot.id === slotId) return slot.options.find((o) => o.id === optionId)!
  throw new Error('missing option')
}
const calc = (...opts: ReturnType<typeof option>[]) =>
  calculateCarSpecs(BODIES[0], DEFAULT_ENGINE_SPEC, new TechModifiers(), { componentOptions: opts, classificationTags: [] })

describe('engine tuning', () => {
  const base = calc()

  it('a turbocharger adds power and costs reliability', () => {
    const turbo = calc(option('forced-induction', 'turbocharger'))
    expect(turbo.powerHp).toBeGreaterThan(base.powerHp * 1.2)
    expect(turbo.reliabilityPercent).toBeLessThan(base.reliabilityPercent)
    expect(turbo.unitCost).toBeGreaterThan(base.unitCost)
  })

  it('a catalytic converter cuts emissions, a sport exhaust raises them', () => {
    expect(calc(option('exhaust', 'catalytic')).emissionsGKm).toBeLessThan(base.emissionsGKm)
    expect(calc(option('exhaust', 'sport-exhaust')).emissionsGKm).toBeGreaterThan(base.emissionsGKm)
  })

  it('long stroke trades power and revs for torque and economy', () => {
    const long = calc(option('bore-stroke', 'long-stroke'))
    expect(long.torqueNm / long.powerHp).toBeGreaterThan(base.torqueNm / base.powerHp)
    expect(long.fuelConsumptionL100Km).toBeLessThan(base.fuelConsumptionL100Km)
    expect(long.maxRpm).toBeLessThan(base.maxRpm)
  })

  it('performance cooling keeps the engine more reliable than air cooling', () => {
    expect(calc(option('cooling', 'performance-cooling')).reliabilityPercent).toBeGreaterThan(calc(option('cooling', 'air-cooled')).reliabilityPercent)
  })

  it('the default (first) option of every tuning slot changes nothing', () => {
    const defaults = DESIGN_STEPS.find((s) => s.id === 'EngineTuning')!.slots.map((s) => s.options[0])
    expect(calc(...defaults)).toEqual(base)
  })
})
