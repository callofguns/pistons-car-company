import { describe, expect, it } from 'vitest'
import {
  buildSaveData,
  isCompatibleSave,
  listSlots,
  loadWorld,
  migrateLegacySaveIfNeeded,
  saveToStorage,
  tryLoadFromStorage,
  SAVE_SLOT_COUNT,
} from '../src/core/save'
import { createNewWorld } from '../src/core/world'
import { createBank } from '../src/core/economy'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { CATALOG } from '../src/data/catalog'
import { createVehicleState, beginNewDesign, selectBody, setEngineSpec, setNameAndCategory, finalizeDesign } from '../src/core/vehicleService'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { TechModifiers } from '../src/core/techModifiers'
import { postNews } from '../src/core/news'
import { makeDate } from '../src/core/gameDate'
import type { BodyStyleDefinition } from '../src/core/vehicles'
import { createMemoryStorage } from './helpers/memoryStorage'

const body: BodyStyleDefinition = {
  id: 'test-body',
  displayName: 'Test Body',
  carClass: 'Coupe',
  engineBayCapacityLiters: 5,
  baseWeightKg: 1200,
  productionEquipmentCost: 0,
  baseUnitCost: 3000,
  unlockYear: 1950,
}

describe('save/load round trip', () => {
  it('round-trips scalar world fields', () => {
    const storage = createMemoryStorage()
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    world.bank.balance = 1_234_567.5
    world.company.companyName = 'Helix'

    saveToStorage(buildSaveData(world), storage)
    const loaded = tryLoadFromStorage(storage)

    expect(loaded).not.toBeNull()
    expect(loaded!.cashBalance).toBe(1_234_567.5)
    expect(loaded!.companyName).toBe('Helix')
    expect(loaded!.year).toBe(DEFAULT_GAME_CONFIG.startYear)
    expect(isCompatibleSave(loaded!)).toBe(true)
  })

  it('treats a save from an old schema as incompatible', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    const data = buildSaveData(world)
    data.schemaVersion = 1 // pre-loans/bankruptcy schema
    expect(isCompatibleSave(data)).toBe(false)
  })

  it('round-trips the model list', () => {
    const storage = createMemoryStorage()
    const vehicles = createVehicleState()
    const bank = createBank(1_000_000)
    beginNewDesign(vehicles)
    selectBody(vehicles, body, bank, 1974)
    setEngineSpec(vehicles, DEFAULT_ENGINE_SPEC)
    setNameAndCategory(vehicles, 'Coupe B200', 'TEST')
    const model = finalizeDesign(vehicles, [body], new TechModifiers(), makeDate(1974, 1, 1), 100_000)
    expect(model).not.toBeNull()
    model!.totalSold = 99037
    model!.salePrice = 27902

    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    world.vehicles = vehicles

    saveToStorage(buildSaveData(world), storage)
    const loaded = tryLoadFromStorage(storage)

    expect(loaded!.models).toHaveLength(1)
    expect(loaded!.models[0].name).toBe('Coupe B200')
    expect(loaded!.models[0].totalSold).toBe(99037)
    expect(loaded!.models[0].salePrice).toBe(27902)
  })

  it('returns null when nothing has been saved', () => {
    const storage = createMemoryStorage()
    expect(tryLoadFromStorage(storage)).toBeNull()
  })

  it('returns null instead of throwing on corrupt data', () => {
    const storage = createMemoryStorage()
    storage.setItem('pistons.save.v1.slot0', '{ not valid json ][')
    expect(() => tryLoadFromStorage(storage)).not.toThrow()
    expect(tryLoadFromStorage(storage)).toBeNull()
  })

  it('round-trips the news feed', () => {
    const storage = createMemoryStorage()
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    postNews(world.news, 'RacingTeamRegistered', makeDate(1971, 3, 1), { teamName: 'Ironclad Racing' })

    saveToStorage(buildSaveData(world), storage)
    const loaded = loadWorld(DEFAULT_GAME_CONFIG, CATALOG, tryLoadFromStorage(storage)!)

    expect(loaded.news.entries).toHaveLength(1)
    expect(loaded.news.entries[0].params.teamName).toBe('Ironclad Racing')
  })

  // Backward compat: a save written before News existed (or a hand-crafted one missing the
  // field) must load with an empty feed, not throw - this is the whole point of adding `news` as
  // an optional field instead of bumping CURRENT_SCHEMA_VERSION (see save.ts's comment on why
  // that's the one thing NOT to do here).
  it('loads a save missing the news field as an empty feed, without throwing', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    const data = buildSaveData(world)
    delete (data as Partial<typeof data>).news

    expect(() => loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data)).not.toThrow()
    expect(loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data).news.entries).toEqual([])
  })

  // A literal guard against reflexively bumping CURRENT_SCHEMA_VERSION when adding a field -
  // isCompatibleSave is a strict === with no migration path, so bumping it silently deletes every
  // existing player's save (see save.ts's doc comment on isCompatibleSave). Adding `news` as an
  // optional field was deliberately NOT supposed to require a bump; this test fails loudly if a
  // future change does it anyway.
  it('keeps the save schema at version 3 (news was added without a schema bump)', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    expect(buildSaveData(world).schemaVersion).toBe(3)
  })

  it('round-trips a pending race entry and race history', () => {
    const storage = createMemoryStorage()
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    world.racing.isRegistered = true
    world.racing.teamName = 'Ironclad Racing'
    world.racing.pendingEntry = { tierId: 'local-circuit', modelId: 'model-1', modelName: 'Test Racer' }
    world.racing.history = [
      { id: 'race-1', tierId: 'local-circuit', modelName: 'Test Racer', position: 1, fieldSize: 6, prize: 1_200_000, date: makeDate(1980, 4, 1) },
    ]
    world.racing.rngState = 999

    saveToStorage(buildSaveData(world), storage)
    const loaded = loadWorld(DEFAULT_GAME_CONFIG, CATALOG, tryLoadFromStorage(storage)!)

    expect(loaded.racing.pendingEntry).toEqual({ tierId: 'local-circuit', modelId: 'model-1', modelName: 'Test Racer' })
    expect(loaded.racing.history).toHaveLength(1)
    expect(loaded.racing.history[0].prize).toBe(1_200_000)
    expect(loaded.racing.rngState).toBe(999)
  })

  // Backward compat: a save written before pending entries/history existed must load with no
  // pending entry and an empty history, not throw - the same optional-field pattern as News (see
  // save.ts's doc comment on why CURRENT_SCHEMA_VERSION must NOT be bumped for this).
  it('loads a save missing the racing entry/history fields without throwing', () => {
    const world = createNewWorld(DEFAULT_GAME_CONFIG)
    const data = buildSaveData(world)
    delete (data as Partial<typeof data>).racingPendingEntry
    delete (data as Partial<typeof data>).racingHistory
    delete (data as Partial<typeof data>).racingRngState

    expect(() => loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data)).not.toThrow()
    const loaded = loadWorld(DEFAULT_GAME_CONFIG, CATALOG, data)
    expect(loaded.racing.pendingEntry).toBeNull()
    expect(loaded.racing.history).toEqual([])
  })
})

describe('save slots', () => {
  it('keeps each slot independent', () => {
    const storage = createMemoryStorage()
    const worldA = createNewWorld(DEFAULT_GAME_CONFIG, 'Alpha Motors')
    const worldB = createNewWorld(DEFAULT_GAME_CONFIG, 'Beta Cars')

    saveToStorage(buildSaveData(worldA), storage, 0)
    saveToStorage(buildSaveData(worldB), storage, 1)

    expect(tryLoadFromStorage(storage, 0)!.companyName).toBe('Alpha Motors')
    expect(tryLoadFromStorage(storage, 1)!.companyName).toBe('Beta Cars')
    expect(tryLoadFromStorage(storage, 2)).toBeNull()
  })

  it('lists every slot, empty ones as null', () => {
    const storage = createMemoryStorage()
    const world = createNewWorld(DEFAULT_GAME_CONFIG, 'Solo Motors')
    saveToStorage(buildSaveData(world), storage, 1)

    const slots = listSlots(storage)

    expect(slots).toHaveLength(SAVE_SLOT_COUNT)
    expect(slots[0]).toBeNull()
    expect(slots[1]!.companyName).toBe('Solo Motors')
    expect(slots[2]).toBeNull()
  })

  it('migrates a pre-slots legacy save into slot 0', () => {
    const storage = createMemoryStorage()
    const world = createNewWorld(DEFAULT_GAME_CONFIG, 'Legacy Co')
    storage.setItem('pistons.save.v1', JSON.stringify(buildSaveData(world)))

    migrateLegacySaveIfNeeded(storage)

    expect(tryLoadFromStorage(storage, 0)!.companyName).toBe('Legacy Co')
    expect(storage.getItem('pistons.save.v1')).toBeNull()
  })

  it('does not touch an existing slot 0 when migrating', () => {
    const storage = createMemoryStorage()
    const current = createNewWorld(DEFAULT_GAME_CONFIG, 'Current Co')
    const legacy = createNewWorld(DEFAULT_GAME_CONFIG, 'Old Co')
    saveToStorage(buildSaveData(current), storage, 0)
    storage.setItem('pistons.save.v1', JSON.stringify(buildSaveData(legacy)))

    migrateLegacySaveIfNeeded(storage)

    expect(tryLoadFromStorage(storage, 0)!.companyName).toBe('Current Co')
  })
})
