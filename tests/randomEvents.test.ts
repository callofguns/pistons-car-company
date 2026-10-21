import { describe, expect, it } from 'vitest'
import { RANDOM_EVENTS, activeRandomMultipliers, eventScale, onRandomEventsDayTick, resolveRandomEvent } from '../src/core/randomEvents'
import { createNewWorld, eventEffectsFor, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { buildSaveData, loadWorld } from '../src/core/save'
import { en } from '../src/i18n/locales/en'
import { beginNewDesign, selectBody, finalizeDesign } from '../src/core/vehicleService'
import { unlockedByYear } from '../src/core/unlocks'

function worldWithCar() {
  const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
  beginNewDesign(world.vehicles)
  selectBody(world.vehicles, CATALOG.bodies[0], world.bank, world.ledger, unlockedByYear(1970), world.time.currentDate)
  world.vehicles.currentSession!.name = 'T'
  finalizeDesign(world.vehicles, CATALOG.bodies, world.research.modifiers, world.time.currentDate)
  return world
}

describe('random events', () => {
  it('every event and choice has its text', () => {
    for (const e of RANDOM_EVENTS) {
      expect(en[`data.randomEvent.${e.id}.title` as keyof typeof en], e.id).toBeTruthy()
      expect(en[`data.randomEvent.${e.id}.message` as keyof typeof en], e.id).toBeTruthy()
      for (const c of e.choices) {
        expect(en[`data.randomEvent.${e.id}.${c.id}.label` as keyof typeof en], `${e.id}.${c.id}`).toBeTruthy()
        if (c.gamble) {
          expect(en[`data.randomEvent.${e.id}.${c.id}.resultWin` as keyof typeof en]).toBeTruthy()
          expect(en[`data.randomEvent.${e.id}.${c.id}.resultLose` as keyof typeof en]).toBeTruthy()
        } else expect(en[`data.randomEvent.${e.id}.${c.id}.result` as keyof typeof en], `${e.id}.${c.id}`).toBeTruthy()
      }
    }
  })

  it('never happens before the first car exists', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    world.randomEvents.daysToNext = 1
    onRandomEventsDayTick(world, world.time.currentDate)
    expect(world.randomEvents.pending).toBeNull()
  })

  it('offers an event, waits for a decision, and applies the choice', () => {
    const world = worldWithCar()
    world.randomEvents.daysToNext = 1
    onRandomEventsDayTick(world, world.time.currentDate)
    const pending = world.randomEvents.pending
    expect(pending).not.toBeNull()
    expect(world.news.entries[0].type).toBe('RandomEvent')

    const event = RANDOM_EVENTS.find((e) => e.id === pending!.eventId)!
    const cashBefore = world.bank.balance
    resolveRandomEvent(world, event.choices[0].id, world.time.currentDate)
    expect(world.randomEvents.pending).toBeNull()
    expect(world.news.entries[0].type).toBe('RandomEventResolved')
    expect(Number.isFinite(world.bank.balance)).toBe(true)
    expect(world.bank.balance).not.toBeNaN()
    void cashBefore
  })

  it('does not stack a second event on an unanswered one', () => {
    const world = worldWithCar()
    world.randomEvents.pending = { eventId: 'refund' }
    world.randomEvents.daysToNext = 1
    onRandomEventsDayTick(world, world.time.currentDate)
    expect(world.randomEvents.pending?.eventId).toBe('refund')
  })

  it('paying the strikers costs cash; refusing slows production for 45 days, then it ends', () => {
    const pay = worldWithCar()
    pay.randomEvents.pending = { eventId: 'strike' }
    const before = pay.bank.balance
    resolveRandomEvent(pay, 'pay', pay.time.currentDate)
    expect(pay.bank.balance).toBeLessThan(before)

    const refuse = worldWithCar()
    refuse.randomEvents.pending = { eventId: 'strike' }
    resolveRandomEvent(refuse, 'refuse', refuse.time.currentDate)
    expect(activeRandomMultipliers(refuse.randomEvents).speed).toBe(0.5)
    expect(eventEffectsFor(refuse, CATALOG).productionSpeedMultiplier).toBeLessThan(1)
    for (let i = 0; i < 45; i++) onRandomEventsDayTick(refuse, refuse.time.currentDate)
    expect(activeRandomMultipliers(refuse.randomEvents).speed).toBe(1)
  })

  it('a lawsuit gamble ends in a win or a loss, and costs scale with the company', () => {
    const world = worldWithCar()
    world.randomEvents.pending = { eventId: 'lawsuit' }
    expect(['win', 'lose']).toContain(resolveRandomEvent(world, 'fight', world.time.currentDate))
    const rich = worldWithCar()
    rich.bank.balance = 1_000_000_000
    expect(eventScale(rich)).toBeGreaterThan(eventScale(worldWithCar()))
  })

  it('survives a save, and a long game produces events without breaking', () => {
    const world = worldWithCar()
    world.randomEvents.pending = { eventId: 'viral' }
    const data = JSON.parse(JSON.stringify(buildSaveData(world)))
    expect(loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data).randomEvents.pending?.eventId).toBe('viral')

    const long = worldWithCar()
    let seen = 0
    for (let day = 0; day < 1500; day++) {
      tickWorld(long, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
      if (long.randomEvents.pending) {
        seen += 1
        resolveRandomEvent(long, RANDOM_EVENTS.find((e) => e.id === long.randomEvents.pending!.eventId)!.choices[0].id, long.time.currentDate)
      }
    }
    expect(seen).toBeGreaterThanOrEqual(3)
    expect(Number.isNaN(long.bank.balance)).toBe(false)
  })
})
