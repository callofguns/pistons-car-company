import { describe, expect, it } from 'vitest'
import { averageScore, reviewDemandMultiplier, reviewModel } from '../src/core/reviews'
import { calculateCarSpecs } from '../src/core/carSpecsCalculator'
import { TechModifiers } from '../src/core/techModifiers'
import { BODIES } from '../src/data/bodies'
import { DEFAULT_ENGINE_SPEC, type CarModel } from '../src/core/vehicles'
import { createNewWorld, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { beginNewDesign, selectBody, finalizeDesign } from '../src/core/vehicleService'
import { unlockedByYear } from '../src/core/unlocks'

function fakeModel(over: Partial<CarModel['stats']> = {}, price = 8000, id = 'm1'): CarModel {
  const stats = { ...calculateCarSpecs(BODIES[0], DEFAULT_ENGINE_SPEC, new TechModifiers()), ...over }
  return { id, stats, salePrice: price } as unknown as CarModel
}

describe('critic reviews', () => {
  it('a strong car scores better than a weak one, and the same car always gets the same review', () => {
    const strong = fakeModel({ powerHp: 220, reliabilityPercent: 95, fuelConsumptionL100Km: 6 })
    const weak = fakeModel({ powerHp: 50, reliabilityPercent: 35, fuelConsumptionL100Km: 16 })
    expect(averageScore(reviewModel(strong, 1972))).toBeGreaterThan(averageScore(reviewModel(weak, 1972)) + 2)
    expect(reviewModel(strong, 1972)).toEqual(reviewModel(strong, 1972))
  })

  it('judges against the year: the same car scores lower in a later era', () => {
    const car = fakeModel()
    expect(averageScore(reviewModel(car, 2010))).toBeLessThan(averageScore(reviewModel(car, 1972)))
  })

  it('good reviews help sales, bad ones hurt, and no reviews change nothing', () => {
    const good = { reviews: [{ critic: 'a', score: 9, aspect: 'power', tone: 'good' }] } as unknown as CarModel
    const bad = { reviews: [{ critic: 'a', score: 2, aspect: 'power', tone: 'bad' }] } as unknown as CarModel
    expect(reviewDemandMultiplier(good)).toBeGreaterThan(1.1)
    expect(reviewDemandMultiplier(bad)).toBeLessThan(0.9)
    expect(reviewDemandMultiplier({} as CarModel)).toBe(1)
  })

  it('reviews arrive with the release, as news', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    beginNewDesign(world.vehicles)
    selectBody(world.vehicles, CATALOG.bodies[0], world.bank, world.ledger, unlockedByYear(1970), world.time.currentDate)
    world.vehicles.currentSession!.name = 'Test'
    const model = finalizeDesign(world.vehicles, CATALOG.bodies, world.research.modifiers, world.time.currentDate)!
    expect(model.reviews).toBeUndefined()
    for (let d = 0; d < 100 && !model.reviews; d++) tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
    expect(model.reviews).toHaveLength(3)
    expect(world.news.entries.some((n) => n.type === 'ModelReviewed')).toBe(true)
  })
})
