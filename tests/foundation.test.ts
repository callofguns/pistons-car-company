import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FOUNDER,
  fansFromSales,
  hqCostMultiplier,
  hqClassDemand,
  marketingDiscountFromFounder,
  startingCapitalFor,
  suggestCompanyName,
  suggestLogo,
  type FounderProfile,
} from '../src/core/foundation'
import { buildSaveData, loadWorld } from '../src/core/save'
import { createNewWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { HQ_REGIONS, LOGO_FORM_COUNT, LOGO_SYMBOL_COUNT } from '../src/data/foundation'
import { en } from '../src/i18n/locales/en'

const founder = (hqId: string, occupationId: FounderProfile['occupationId'] = 'marketer'): FounderProfile => ({
  ...DEFAULT_FOUNDER,
  hqId,
  occupationId,
})

describe('HQ region effects', () => {
  it('Washington halves the cost of SUVs and pickups only', () => {
    const car = { unitCost: 6000, powerHp: 150 }
    expect(hqCostMultiplier(founder('usa'), { ...car, carClass: 'SUV' })).toBe(0.5)
    expect(hqCostMultiplier(founder('usa'), { ...car, carClass: 'Truck' })).toBe(0.5)
    expect(hqCostMultiplier(founder('usa'), { ...car, carClass: 'Sedan' })).toBe(1)
  })

  it("Brasilia cuts only the engine's share of the cost", () => {
    const multiplier = hqCostMultiplier(founder('brazil'), { carClass: 'Sedan', unitCost: 6000, powerHp: 100 })
    expect(multiplier).toBeGreaterThan(0.92)
    expect(multiplier).toBeLessThan(1)
  })

  it('Mexico City makes every car 10% cheaper', () => {
    expect(hqCostMultiplier(founder('mexico'), { carClass: 'Coupe', unitCost: 4000, powerHp: 90 })).toBeCloseTo(0.9)
  })

  it('London boosts sports and coupe buyers', () => {
    expect(hqClassDemand(founder('uk')).Sports).toBeGreaterThan(1)
    expect(hqClassDemand(founder('usa')).Sports).toBeUndefined()
  })

  it('has a name and description for every region', () => {
    for (const region of HQ_REGIONS) {
      expect(en[`data.hq.${region.id}.region` as keyof typeof en]).toBeTruthy()
      expect(en[`data.hq.${region.id}.desc` as keyof typeof en]).toBeTruthy()
    }
  })
})

describe('backgrounds', () => {
  it('the businessman starts with 20% more money', () => {
    expect(startingCapitalFor(45_000_000, founder('usa', 'businessman'))).toBe(54_000_000)
    expect(startingCapitalFor(45_000_000, founder('usa', 'marketer'))).toBe(45_000_000)
  })

  it('the innovator starts with 50 research points', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG, 'X', 'normal', founder('usa', 'innovator'))
    expect(world.research.points).toBe(DEFAULT_GAME_CONFIG.startingResearchPoints + 50)
  })

  it('the marketer gets 10% cheaper campaigns, the public figure 2.5% more fans', () => {
    expect(marketingDiscountFromFounder(founder('usa', 'marketer'))).toBe(10)
    expect(fansFromSales(100, 0, founder('usa', 'publicFigure'))).toBeCloseTo(102.5)
    expect(fansFromSales(100, 0, founder('usa', 'marketer'))).toBeCloseTo(100)
  })
})

describe('new company', () => {
  it('uses the HQ city and keeps the choices through a save', () => {
    const chosen = founder('japan', 'businessman')
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG, 'Test Motors', 'normal', chosen)
    expect(world.company.homeCity).toBe('Tokyo')
    expect(world.bank.balance).toBe(54_000_000)

    const loaded = loadWorld(DEFAULT_GAME_CONFIG, CATALOG, buildSaveData(world))
    expect(loaded.company.founder).toEqual(chosen)
    expect(loaded.bank.balance).toBe(54_000_000)
  })

  it('an older save without the setup choices still loads', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG, 'Old', 'normal')
    const data = buildSaveData(world)
    delete data.founder
    delete data.fans
    const loaded = loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data)
    expect(loaded.company.founder).toBeUndefined()
    expect(loaded.company.fans).toBe(0)
  })

  it('suggestions are stable for a seed and stay in range', () => {
    expect(suggestCompanyName(3)).toBe(suggestCompanyName(3))
    const logo = suggestLogo(9)
    expect(logo.symbol).toBeLessThan(LOGO_SYMBOL_COUNT)
    expect(logo.form).toBeLessThan(LOGO_FORM_COUNT)
  })
})
