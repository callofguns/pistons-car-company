import { describe, expect, it } from 'vitest'
import { createRivalsState, onRivalsDayTick, rivalAppeal, rivalStrength } from '../src/core/rivals'
import { createNewWorld, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { buildSaveData, loadWorld } from '../src/core/save'

describe('rival makers', () => {
  it('start as three named companies with about the old fixed strength', () => {
    const rivals = createRivalsState(1970)
    expect(rivals.rivals.map((r) => r.name)).toEqual(['Marlowe Motors', 'Kessler & Voss', 'Corvano'])
    expect(rivalStrength(rivals, 1970)).toBeCloseTo(1.08, 1)
  })

  it('get a little stronger every year', () => {
    const rivals = createRivalsState(1970)
    expect(rivalAppeal(rivals.rivals[0], 2000)).toBeGreaterThan(rivalAppeal(rivals.rivals[0], 1970))
  })

  it('sell the cars the player did not, split by appeal', () => {
    const rivals = createRivalsState(1970)
    onRivalsDayTick(rivals, 1970, 1000, 100)
    const sold = rivals.rivals.reduce((sum, r) => sum + r.totalSold, 0)
    expect(sold).toBeCloseTo(900)
    expect(rivals.rivals[0].totalSold).toBeGreaterThan(rivals.rivals[1].totalSold) // 0.62 beats 0.58
  })

  it('launch new models on their own, boosting appeal that then fades', () => {
    const rivals = createRivalsState(1970)
    const rival = rivals.rivals[0]
    rival.daysToNextLaunch = 1
    const launches = onRivalsDayTick(rivals, 1970, 1000, 0)
    expect(launches.map((l) => l.rival.id)).toContain(rival.id)
    const boosted = rival.launchBoost
    rival.daysToNextLaunch = 100_000
    expect(boosted).toBeGreaterThan(0.04)
    for (let i = 0; i < 700; i++) onRivalsDayTick(rivals, 1970, 1000, 0)
    expect(rival.launchBoost).toBeLessThan(boosted * 0.6)
  })

  it('survive a save and load, and older saves without rivals get a fresh set', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)
    for (let d = 0; d < 400; d++) tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
    const data = JSON.parse(JSON.stringify(buildSaveData(world)))
    expect(loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data).rivals.rivals[0].daysToNextLaunch).toBe(world.rivals.rivals[0].daysToNextLaunch)
    delete data.rivals
    expect(loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data).rivals.rivals).toHaveLength(3)
  })
})
