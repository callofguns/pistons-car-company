import { describe, expect, it } from 'vitest'
import {
  buildSaveData,
  isCompatibleSave,
  listSlots,
  migrateLegacySaveIfNeeded,
  saveToStorage,
  tryLoadFromStorage,
  SAVE_SLOT_COUNT,
} from '../src/core/save'
import { createNewWorld } from '../src/core/world'
import { createBank } from '../src/core/economy'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { createVehicleState, beginNewDesign, selectBody, setEngineSpec, setNameAndCategory, finalizeDesign } from '../src/core/vehicleService'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { TechModifiers } from '../src/core/techModifiers'
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
