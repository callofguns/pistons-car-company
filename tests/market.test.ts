import { describe, expect, it } from 'vitest'
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
  baseDemandPerDay: 100_000, // deliberately absurd, to try to oversell inventory
}

const TODAY = makeDate(1974, 1, 1)

function buildModel(inventory: number) {
  const today = TODAY
  const bank = createBank(1_000_000)
  const vehicles = createVehicleState()

  beginNewDesign(vehicles)
  selectBody(vehicles, body, bank, 1974)
  setEngineSpec(vehicles, DEFAULT_ENGINE_SPEC)
  setNameAndCategory(vehicles, 'Test Model', 'TEST')
  const model = finalizeDesign(vehicles, [body], new TechModifiers(), today, 1_000_000)
  if (!model) throw new Error('finalizeDesign failed in test setup')
  model.inventory = inventory

  return { vehicles, model, bank }
}

describe('onMarketDayTick', () => {
  it('never sells more than inventory', () => {
    const { vehicles, model, bank } = buildModel(5)
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)
    company.reputationPercent = 50

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState(100))

    expect(model.totalSold).toBeLessThanOrEqual(5)
    expect(model.inventory).toBeGreaterThanOrEqual(0)
    expect(model.inventory).toBe(5 - model.totalSold)
  })

  it('sells nothing with no inventory', () => {
    const { vehicles, model, bank } = buildModel(0)
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState(100))

    expect(model.totalSold).toBe(0)
  })

  it('drifts reputation up when reliable cars sell', () => {
    const { vehicles, model, bank } = buildModel(1000)
    model.stats.reliabilityPercent = 95 // well above the starting reputation
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)
    company.reputationPercent = 15.5

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState(100))

    expect(model.totalSold).toBeGreaterThan(0)
    expect(company.reputationPercent).toBeGreaterThan(15.5)
  })

  it('leaves reputation unchanged when nothing sells', () => {
    const { vehicles, bank } = buildModel(0)
    const company = createCompanyState('Test Co', 'Testville', 1_000_000)
    company.reputationPercent = 15.5

    onMarketDayTick(vehicles.models, [segment], (m) => resolveBody([body], m), bank, createLedgerState(), TODAY, company, createCompetitorState(100))

    expect(company.reputationPercent).toBe(15.5)
  })
})
