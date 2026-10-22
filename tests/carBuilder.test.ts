import { describe, expect, it } from 'vitest'
import { BRAKE_RANGE, DEFAULT_TUNING, paintHex, tuningOption } from '../src/core/carTuning'
import { passesEmissions, regionDemandFactor, regionEmissionLimit, regionFees, worldEmissionLimit } from '../src/core/salesRegions'
import { SALES_REGIONS } from '../src/data/salesRegions'
import { DESIGN_STEPS } from '../src/data/designSteps'
import { en } from '../src/i18n/locales/en'

describe('designer sliders', () => {
  it('bigger brakes handle better but weigh and cost more', () => {
    const small = tuningOption(DEFAULT_TUNING)
    const big = tuningOption({ ...DEFAULT_TUNING, brakeFrontMm: BRAKE_RANGE.max, brakeRearMm: BRAKE_RANGE.max })
    expect(big.effects.handling ?? 0).toBeGreaterThan(small.effects.handling ?? 0)
    expect(big.weightDeltaKg).toBeGreaterThan(small.weightDeltaKg)
    expect(big.costDelta).toBeGreaterThan(small.costDelta)
  })

  it('more downforce helps handling and costs fuel', () => {
    const none = tuningOption({ ...DEFAULT_TUNING, downforcePct: 0 })
    const lots = tuningOption({ ...DEFAULT_TUNING, downforcePct: 100 })
    expect(lots.effects.handling ?? 0).toBeGreaterThan(none.effects.handling ?? 0)
    expect(lots.engine?.fuelPct ?? 0).toBeGreaterThan(none.engine?.fuelPct ?? 0)
  })

  it('turns a hue into a hex colour', () => {
    expect(paintHex({ hue: 0, light: 50 })).toMatch(/^#[0-9a-f]{6}$/)
    expect(paintHex({ hue: 120, light: 50 })).not.toBe(paintHex({ hue: 240, light: 50 }))
  })
})

describe('sales regions', () => {
  it('the world weights add up to 1', () => {
    expect(SALES_REGIONS.reduce((sum, r) => sum + r.weight, 0)).toBeCloseTo(1)
  })

  it('every region has a name and description', () => {
    for (const r of SALES_REGIONS) {
      expect(en[`data.region.${r.id}.name` as keyof typeof en]).toBeTruthy()
      expect(en[`data.region.${r.id}.desc` as keyof typeof en]).toBeTruthy()
    }
  })

  it('emission limits tighten over time and differ by region', () => {
    expect(worldEmissionLimit(1970)).toBe(999)
    expect(worldEmissionLimit(2010)).toBeLessThan(worldEmissionLimit(1980))
    const europe = SALES_REGIONS.find((r) => r.id === 'europe')!
    const africa = SALES_REGIONS.find((r) => r.id === 'africa')!
    expect(regionEmissionLimit(europe, 2000)).toBeLessThan(regionEmissionLimit(africa, 2000))
    expect(passesEmissions(europe, 400, 1970)).toBe(true)
    expect(passesEmissions(europe, 400, 2010)).toBe(false)
  })

  it('selling everywhere is the old behaviour; fewer regions sell less', () => {
    const all = SALES_REGIONS.map((r) => r.id)
    expect(regionDemandFactor(undefined, 'Sedan', 300, 1980)).toBe(1)
    expect(regionDemandFactor(all, 'SUV', 300, 1970)).toBeCloseTo(1)
    expect(regionDemandFactor(['europe'], 'Sedan', 300, 1970)).toBeLessThan(0.5)
    expect(regionDemandFactor(['north-america'], 'Truck', 300, 1970)).toBeGreaterThan(regionDemandFactor(['north-america'], 'Sedan', 300, 1970))
  })

  it('a car that fails the emission rules does not sell in that region', () => {
    expect(regionDemandFactor(['europe'], 'Sedan', 900, 2010)).toBe(0)
  })

  it('adds up the fees', () => {
    expect(regionFees(['north-america', 'europe'])).toBe(165_000)
  })
})

describe('new parts', () => {
  it('every new slot is in a design step and has text', () => {
    for (const slotId of ['gears', 'differential', 'traction-aids', 'caliper', 'tire-type', 'interior-level', 'seats', 'entertainment', 'acoustics']) {
      const slot = DESIGN_STEPS.flatMap((s) => s.slots).find((s) => s.id === slotId)
      expect(slot, slotId).toBeTruthy()
      expect(slot!.options.length).toBeGreaterThan(1)
    }
  })
})

describe('the first production run and the launch presentation', () => {
  it('orders the first run on a free line when the car is released, and starts the presentation', async () => {
    const { createNewWorld, advanceOneDay } = await import('../src/core/world')
    const { DEFAULT_GAME_CONFIG } = await import('../src/core/gameConfig')
    const { CATALOG } = await import('../src/data/catalog')
    const { beginNewDesign, selectBody, setNameAndCategory, finalizeDesign, setProductionPlan } = await import('../src/core/vehicleService')
    const { unlockedByYear } = await import('../src/core/unlocks')
    const { makeDate } = await import('../src/core/gameDate')

    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG, 'Run Motors', 'normal')
    const today = world.time.currentDate
    expect(world.factory.lines.length).toBeGreaterThan(0)

    beginNewDesign(world.vehicles)
    const body = CATALOG.bodies.find((b) => b.id === 'classic-saloon')!
    selectBody(world.vehicles, body, world.bank, world.ledger, unlockedByYear(1970), makeDate(1970, 1, 1))
    setNameAndCategory(world.vehicles, 'Runner', 'X')
    setProductionPlan(world.vehicles, 400, true)
    const model = finalizeDesign(world.vehicles, CATALOG.bodies, world.research.modifiers, today)!
    model.developmentDaysRemaining = 1

    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, today)
    expect(world.factory.lines[0].modelId).toBe(model.id)
    expect(world.factory.lines[0].orderRemaining + model.inventory).toBeGreaterThanOrEqual(1)
    expect(model.marketingActive).toBe(true)
  })
})
