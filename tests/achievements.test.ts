import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, checkAchievements, isUnlocked, nextGoals, progress01 } from '../src/core/achievements'
import { createNewWorld, tickWorld } from '../src/core/world'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { buildSaveData, loadWorld } from '../src/core/save'
import { en } from '../src/i18n/locales/en'

const newWorld = () => createNewWorld(DEFAULT_GAME_CONFIG, CATALOG)

describe('achievements', () => {
  it('every achievement has a name and a description template', () => {
    for (const a of ACHIEVEMENTS) {
      expect(en[`data.achievement.${a.id}.name` as keyof typeof en], a.id).toBeTruthy()
      expect(en[`achievement.desc.${a.kind}` as keyof typeof en], a.kind).toBeTruthy()
    }
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })

  it('unlocks when the target is reached, pays the reward once and posts news', () => {
    const world = newWorld()
    world.company.totalCarsSoldAllModels = 150
    const cashBefore = world.bank.balance
    const today = world.time.currentDate

    expect(checkAchievements(world, today)).toEqual(['sold-100'])
    expect(world.bank.balance).toBe(cashBefore + 250_000)
    expect(world.news.entries[0].type).toBe('AchievementUnlocked')
    expect(isUnlocked(world.achievements, 'sold-100')).toBe(true)

    expect(checkAchievements(world, today)).toEqual([])
    expect(world.bank.balance).toBe(cashBefore + 250_000)
  })

  it('shows progress toward a goal and lists the closest ones first', () => {
    const world = newWorld()
    world.company.totalCarsSoldAllModels = 50
    const def = ACHIEVEMENTS.find((a) => a.id === 'sold-100')!
    expect(progress01(def, world)).toBeCloseTo(0.5)
    expect(nextGoals(world, 1)[0].def.id).toBe('sold-100')
  })

  it('"number one" needs real sales and more share than every rival', () => {
    const world = newWorld()
    world.company.marketSharePercent = 90
    expect(checkAchievements(world, world.time.currentDate)).not.toContain('number-one')
    world.company.totalCarsSoldAllModels = 1
    expect(checkAchievements(world, world.time.currentDate)).toContain('number-one')
  })

  it('are saved and loaded, and an older save is credited quietly', () => {
    const world = newWorld()
    world.company.totalCarsSoldAllModels = 1500
    for (let d = 0; d < 3; d++) tickWorld(world, CATALOG, DEFAULT_GAME_CONFIG, DEFAULT_GAME_CONFIG.secondsPerDay)
    const data = JSON.parse(JSON.stringify(buildSaveData(world)))
    expect(Object.keys(loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data).achievements.unlocked)).toEqual(expect.arrayContaining(['sold-100', 'sold-1k']))

    delete data.achievements
    data.news = []
    data.cashBalance = 10_000_000
    const old = loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data)
    expect(isUnlocked(old.achievements, 'sold-1k')).toBe(true)
    expect(old.bank.balance).toBe(10_000_000) // no payout
    expect(old.news.entries.some((n) => n.type === 'AchievementUnlocked')).toBe(false)
  })
})
