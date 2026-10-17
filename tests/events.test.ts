import { describe, expect, it } from 'vitest'
import { activeEvents, combineEvents, eventChangesToday, isEventActive } from '../src/core/events'
import { HISTORY_EVENTS } from '../src/data/historyEvents'
import { makeDate } from '../src/core/gameDate'
import { createNewWorld, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import type { CarModel } from '../src/core/vehicles'

const event = (id: string) => HISTORY_EVENTS.find((e) => e.id === id)!

describe('history events', () => {
  it('the 1973 oil crisis runs for 18 months from October 1973', () => {
    const crisis = event('oil-crisis-1973')
    expect(isEventActive(crisis, makeDate(1973, 9, 30))).toBe(false)
    expect(isEventActive(crisis, makeDate(1973, 10, 1))).toBe(true)
    expect(isEventActive(crisis, makeDate(1975, 3, 31))).toBe(true)
    expect(isEventActive(crisis, makeDate(1975, 4, 1))).toBe(false)
  })

  it('laws stay in force forever', () => {
    expect(isEventActive(event('airbag-law-1998'), makeDate(2040, 1, 1))).toBe(true)
  })

  it('effects multiply together and regulations hit only the cars they target', () => {
    const effects = combineEvents(activeEvents(HISTORY_EVENTS, makeDate(1974, 1, 1)))
    expect(effects.demandMultiplier).toBeCloseTo(0.8)
    expect(effects.fuelEconomyWeightMultiplier).toBeGreaterThan(1)

    const law = combineEvents([event('airbag-law-1998')])
    const noAirbags = { componentSelections: { airbags: 'none' } } as unknown as CarModel
    const withAirbags = { componentSelections: { airbags: 'dual-front' } } as unknown as CarModel
    expect(law.modelMultiplier(noAirbags)).toBeLessThan(1)
    expect(law.modelMultiplier(withAirbags)).toBe(1)
  })

  it('starts and ends are reported on the 1st of the month', () => {
    expect(eventChangesToday(HISTORY_EVENTS, makeDate(1973, 10, 1)).started.map((e) => e.id)).toEqual(['oil-crisis-1973'])
    expect(eventChangesToday(HISTORY_EVENTS, makeDate(1975, 4, 1)).ended.map((e) => e.id)).toEqual(['oil-crisis-1973'])
    expect(eventChangesToday(HISTORY_EVENTS, makeDate(1973, 10, 2)).started).toEqual([])
  })

  it('posts news when an event starts', () => {
    const world = createNewWorld({ ...DEFAULT_GAME_CONFIG, startYear: 1973, startMonth: 9, startDay: 30 }, CATALOG)
    for (let day = 0; day < 3; day++) tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
    expect(world.news.entries.some((n) => n.type === 'HistoryEventStarted' && n.params.eventId === 'oil-crisis-1973')).toBe(true)
  })
})
