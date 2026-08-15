import { describe, expect, it } from 'vitest'
import { advanceOneDay, createNewWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { makeDate } from '../src/core/gameDate'
import { createVehicleState, beginNewDesign, selectBody, setEngineSpec, setNameAndCategory, finalizeDesign } from '../src/core/vehicleService'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { TechModifiers } from '../src/core/techModifiers'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import type { BodyStyleDefinition } from '../src/core/vehicles'

const body: BodyStyleDefinition = {
  id: 'test-body',
  displayName: 'Test Body',
  carClass: 'Sports',
  engineBayCapacityLiters: 5,
  baseWeightKg: 1200,
  productionEquipmentCost: 0,
  baseUnitCost: 3000,
  unlockYear: 1950,
}

/** Builds a real CarModel (same pattern as tests/market.test.ts's buildModel) with stats strong
 * enough to guarantee a 1st-place finish against any of CATALOG.raceTiers' opponent rolls. */
function buildWinningModel() {
  const vehicles = createVehicleState()
  const bank = createBank(1_000_000)
  const ledger = createLedgerState()
  beginNewDesign(vehicles)
  selectBody(vehicles, body, bank, ledger, 1980, makeDate(1980, 1, 1))
  setEngineSpec(vehicles, DEFAULT_ENGINE_SPEC)
  setNameAndCategory(vehicles, 'Test Racer', 'TEST')
  const model = finalizeDesign(vehicles, [body], new TechModifiers(), makeDate(1980, 1, 1), 1_000_000)
  if (!model) throw new Error('finalizeDesign failed in test setup')
  model.stats.rating = 10
  model.stats.designStats.handling = 100
  model.stats.reliabilityPercent = 100
  model.stats.topSpeedKph = 400
  return model
}

/**
 * Integration tests through the real advanceOneDay path, styled after tests/newsEvents.test.ts -
 * driving the calendar directly for exact control over which day is "day 1" (the monthly-tick
 * boundary onRacingMonthTick resolves on), rather than depending on tickWorld's real-time stepping
 * or the store layer's enterRace action.
 */
describe('racing events - integration through advanceOneDay', () => {
  it('resolves a pending entry on the next day===1 rollover, posts exactly one RaceCompleted entry, and counts the prize in that month\'s MonthlyReport income', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    const tier = CATALOG.raceTiers[0]
    const model = buildWinningModel()
    world.vehicles.models.push(model)

    world.racing.isRegistered = true
    world.racing.teamName = 'Test Racing'
    world.racing.pendingEntry = { tierId: tier.id, modelId: model.id, modelName: model.name }

    const day1 = makeDate(1980, 4, 1)
    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, day1)

    expect(world.racing.pendingEntry).toBeNull()
    expect(world.racing.history).toHaveLength(1)
    expect(world.racing.history[0].position).toBe(1)
    expect(world.racing.history[0].prize).toBe(tier.firstPrize)

    const raceEntries = world.news.entries.filter((e) => e.type === 'RaceCompleted')
    expect(raceEntries).toHaveLength(1)
    expect(raceEntries[0].params.tierId).toBe(tier.id)
    expect(raceEntries[0].params.modelName).toBe(model.name)

    // The ordering trap: onRacingMonthTick must run BEFORE the MonthlyReport snapshot, or the
    // prize wouldn't show up in this month's reported income at all.
    const report = world.news.entries.find((e) => e.type === 'MonthlyReport')
    expect(report).toBeDefined()
    expect(Number(report!.params.income)).toBeGreaterThanOrEqual(tier.firstPrize)
  })

  it('does not resolve a pending entry on a non-day-1 tick', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    const tier = CATALOG.raceTiers[0]
    const model = buildWinningModel()
    world.vehicles.models.push(model)

    world.racing.isRegistered = true
    world.racing.pendingEntry = { tierId: tier.id, modelId: model.id, modelName: model.name }

    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, makeDate(1980, 4, 15))

    expect(world.racing.pendingEntry).not.toBeNull()
    expect(world.racing.history).toHaveLength(0)
    expect(world.news.entries.some((e) => e.type === 'RaceCompleted')).toBe(false)
  })

  it('does not post a RaceCompleted entry, or crash, when there is no pending entry', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    advanceOneDay(world, CATALOG, DEFAULT_GAME_CONFIG, makeDate(1980, 4, 1))
    expect(world.news.entries.some((e) => e.type === 'RaceCompleted')).toBe(false)
  })
})
