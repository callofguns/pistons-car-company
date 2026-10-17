import { describe, expect, it } from 'vitest'
import { unlockedByYear } from '../src/core/unlocks'
import { onMarketDayTick, createCompetitorState } from '../src/core/market'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { createCompanyState } from '../src/core/company'
import { TechModifiers } from '../src/core/techModifiers'
import { createVehicleState, beginNewDesign, selectBody, setEngineSpec, setNameAndCategory, finalizeDesign, resolveBody } from '../src/core/vehicleService'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { makeDate } from '../src/core/gameDate'
import type { BodyStyleDefinition } from '../src/core/vehicles'
import type { MarketSegmentDefinition } from '../src/core/market'

const body: BodyStyleDefinition = {
  id: 'test-body',
  displayName: 'Test Body',
  carClass: 'Sedan',
  engineBayCapacityLiters: 6,
  baseWeightKg: 1200,
  productionEquipmentCost: 0,
  baseUnitCost: 1000,
  unlockYear: 1950,
}

const segment: MarketSegmentDefinition = {
  id: 'test-segment',
  displayName: 'Test Segment',
  preferredClass: 'Sedan',
  weightPower: 0.25,
  weightReliability: 0.25,
  weightFuelEconomy: 0.25,
  weightPrice: 0.25,
  populationShare: 1,
  expectedPrice: 10_000,
  marketCarsPerDay: 10_000_000, // deliberately absurd, to try to oversell inventory
}

// A realistic-size segment, for tests about a brand-new company with little reach.
const tinyReachSegment: MarketSegmentDefinition = {
  ...segment,
  marketCarsPerDay: 2_000,
}

const TODAY = makeDate(1974, 1, 1)

function buildModel(inventory: number) {
  const today = TODAY
  const bank = createBank(1_000_000)
  const ledger = createLedgerState()
  const vehicles = createVehicleState()

  beginNewDesign(vehicles)
  selectBody(vehicles, body, bank, ledger, unlockedByYear(1974), today)
  setEngineSpec(vehicles, DEFAULT_ENGINE_SPEC)
  setNameAndCategory(vehicles, 'Test Model', 'TEST')
  const model = finalizeDesign(vehicles, [body], new TechModifiers(), today, 1_000_000)
  if (!model) throw new Error('finalizeDesign failed in test setup')
  model.inventory = inventory
  model.developmentDaysRemaining = 0 // these tests are about selling a released car

  return { vehicles, model, bank }
}

describe('onMarketDayTick', () => {
  it('never sells more than inventory', () => {
    const { vehicles, model, bank } = buildModel(5)
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)
    company.reputationPercent = 50

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(model.totalSold).toBeLessThanOrEqual(5)
    expect(model.inventory).toBeGreaterThanOrEqual(0)
    expect(model.inventory).toBe(5 - model.totalSold)
  })

  it('sells nothing with no inventory', () => {
    const { vehicles, model, bank } = buildModel(0)
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(model.totalSold).toBe(0)
  })

  it('drifts reputation up when reliable cars sell', () => {
    const { vehicles, model, bank } = buildModel(1000)
    model.stats.reliabilityPercent = 95 // well above the starting reputation
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)
    company.reputationPercent = 15.5

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(model.totalSold).toBeGreaterThan(0)
    expect(company.reputationPercent).toBeGreaterThan(15.5)
  })

  it('leaves reputation unchanged when nothing sells', () => {
    const { vehicles, bank } = buildModel(0)
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)
    company.reputationPercent = 15.5

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(company.reputationPercent).toBe(15.5)
  })

  it("sells a brand-new company's first car at the starting reach", () => {
    const { vehicles, model, bank } = buildModel(1000)
    const company = createCompanyState('Test Co', 'Testville', 20_000) // matches DEFAULT_GAME_CONFIG.startingPopulation

    for (let day = 0; day < 5; day++) {
      onMarketDayTick(vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())
    }

    expect(model.totalSold).toBeGreaterThan(0)
  })

  it('sells nothing when nobody has heard of the company', () => {
    const { vehicles, model, bank } = buildModel(1000)
    const company = createCompanyState('Test Co', 'Testville', 0)

    onMarketDayTick(vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(model.totalSold).toBe(0)
  })

  it('a difficulty demand multiplier scales sales', () => {
    const easy = buildModel(100_000)
    const hard = buildModel(100_000)
    const conditions = (m: number) => ({ demandMultiplier: m, fuelEconomyWeightMultiplier: 1, powerWeightMultiplier: 1, classDemandMultiplier: {}, modelMultiplier: () => 1 })
    const companyA = createCompanyState('A', 'X', 200_000)
    const companyB = createCompanyState('B', 'X', 200_000)
    onMarketDayTick(easy.vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), easy.bank, createLedgerState(), TODAY, companyA, createCompetitorState(), conditions(1.3))
    onMarketDayTick(hard.vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), hard.bank, createLedgerState(), TODAY, companyB, createCompetitorState(), conditions(0.75))
    expect(easy.model.totalSold).toBeGreaterThan(hard.model.totalSold)
  })

  it('grows population served from actual sales (word of mouth)', () => {
    const { vehicles, bank } = buildModel(1000)
    const company = createCompanyState('Test Co', 'Testville', 200_000)

    onMarketDayTick(vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(company.populationServed).toBeGreaterThan(200_000)
  })

  it('leaves population served unchanged when nothing sells', () => {
    const { vehicles, bank } = buildModel(0)
    const company = createCompanyState('Test Co', 'Testville', 100)

    onMarketDayTick(vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState())

    expect(company.populationServed).toBe(100)
  })

  it('carries fractional demand forward, so under-one-car-a-day demand still sells over time', () => {
    const { vehicles, model, bank } = buildModel(1000)
    // Small enough reach that a single day's demand is well under one car.
    const company = createCompanyState('Test Co', 'Testville', 300)
    const ledger = createLedgerState()
    const competitors = createCompetitorState()

    onMarketDayTick(vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), bank, ledger, TODAY, company, competitors)
    expect(model.totalSold).toBe(0)
    expect(model.demandCarry).toBeGreaterThan(0)

    for (let day = 0; day < 60; day++) {
      onMarketDayTick(vehicles.models, [tinyReachSegment], (m) => resolveBody([body], m), bank, ledger, TODAY, company, competitors)
    }
    expect(model.totalSold).toBeGreaterThan(0)
  })
})
