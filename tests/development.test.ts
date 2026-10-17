import { describe, expect, it } from 'vitest'
import { createNewWorld, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { beginNewDesign, selectBody, toggleClassificationTag, finalizeDesign } from '../src/core/vehicleService'
import { developmentDaysFor, isInDevelopment, MAX_DEVELOPMENT_DAYS, MIN_DEVELOPMENT_DAYS } from '../src/core/development'
import type { Employee } from '../src/core/staff'

const tick = (world: ReturnType<typeof createNewWorld>, days: number) => {
  for (let i = 0; i < days; i++) tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
}

function worldWithNewCar() {
  const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
  world.bank.balance = 10_000_000
  beginNewDesign(world.vehicles)
  selectBody(world.vehicles, CATALOG.bodies[0], world.bank, world.ledger, 1970, world.time.currentDate)
  toggleClassificationTag(world.vehicles, 'budget')
  toggleClassificationTag(world.vehicles, 'sport')
  world.vehicles.currentSession!.name = 'Test'
  const model = finalizeDesign(world.vehicles, CATALOG.bodies, world.research.modifiers, world.time.currentDate)!
  return { world, model }
}

describe('developmentDaysFor', () => {
  it('stays within the 20-90 day range', () => {
    expect(developmentDaysFor(0, [])).toBe(MIN_DEVELOPMENT_DAYS)
    expect(developmentDaysFor(1_000_000, ['luxury', 'track'])).toBe(MAX_DEVELOPMENT_DAYS)
  })

  it('takes longer for pricier and higher-class cars', () => {
    expect(developmentDaysFor(9_000, ['budget'])).toBeLessThan(developmentDaysFor(9_000, ['luxury']))
    expect(developmentDaysFor(4_000, ['medium'])).toBeLessThan(developmentDaysFor(12_000, ['medium']))
  })
})

describe('research points and development', () => {
  it('a new company starts with no research points and earns none without a car in development', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    expect(world.research.points).toBe(0)
    tick(world, 40)
    expect(world.research.points).toBe(0)
  })

  it('earns points each day only while a car is in development, then it goes on sale', () => {
    const { world, model } = worldWithNewCar()
    const days = model.developmentDaysRemaining!
    expect(days).toBeGreaterThanOrEqual(MIN_DEVELOPMENT_DAYS)
    expect(isInDevelopment(model)).toBe(true)

    tick(world, 1)
    expect(world.research.points).toBe(DEFAULT_GAME_CONFIG.researchPointsPerDay)
    expect(model.totalProduced).toBe(0) // nothing built while still in development

    tick(world, days - 1)
    expect(isInDevelopment(model)).toBe(false)
    expect(world.research.points).toBe(DEFAULT_GAME_CONFIG.researchPointsPerDay * days)
    expect(world.news.entries.some((e) => e.type === 'ModelReleased')).toBe(true)

    // Released straight onto the idle starting line - order some cars and they get built.
    expect(world.factory.lines[0].modelId).toBe(model.id)
    world.factory.lines[0].orderRemaining = 100
    tick(world, 10)
    expect(world.research.points).toBe(DEFAULT_GAME_CONFIG.researchPointsPerDay * days) // stopped
    expect(model.totalProduced).toBeGreaterThan(0)
  })

  it('Engineers raise the daily rate while developing', () => {
    const { world } = worldWithNewCar()
    const engineer: Employee = { id: 'e1', name: 'Eng', role: 'Engineer', skill: 10, skillProgress01: 0, perkId: null, monthlySalary: 1_000 }
    world.staff.employees = [engineer]
    tick(world, 1)
    expect(world.research.points).toBeGreaterThan(DEFAULT_GAME_CONFIG.researchPointsPerDay)
  })
})
