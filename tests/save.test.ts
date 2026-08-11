import { describe, expect, it } from 'vitest'
import { buildSaveData, isCompatibleSave, saveToStorage, tryLoadFromStorage, type KeyValueStorage } from '../src/core/save'
import { createNewWorld } from '../src/core/world'
import { createBank } from '../src/core/economy'
import { DEFAULT_GAME_CONFIG } from '../src/core/gameConfig'
import { createVehicleState, beginNewDesign, selectBody, setEngineSpec, setNameAndCategory, finalizeDesign } from '../src/core/vehicleService'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { TechModifiers } from '../src/core/techModifiers'
import { makeDate } from '../src/core/gameDate'
import type { BodyStyleDefinition } from '../src/core/vehicles'

function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

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
    selectBody(vehicles, body, bank)
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
    storage.setItem('pistons.save.v1', '{ not valid json ][')
    expect(() => tryLoadFromStorage(storage)).not.toThrow()
    expect(tryLoadFromStorage(storage)).toBeNull()
  })
})
