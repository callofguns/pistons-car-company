import type { Catalog } from './catalog'
import type { LoanState } from './economy'
import type { GameConfig } from './gameConfig'
import { makeDate } from './gameDate'
import { createNewWorld, type World } from './world'
import type { CarModel } from './vehicles'

/** One research node's saved progress. Effects aren't serialized - on load they're re-applied to a fresh TechModifiers from the catalog definition, same as ResearchService.RestoreState did in the C# port. */
export interface ResearchNodeSaveEntry {
  nodeId: string
  started: boolean
  isBreakthrough: boolean
  progress: number
  researched: boolean
}

/** The complete, flat, JSON-serializable snapshot of a game in progress. Direct port of SaveGameData.cs, minus the ScriptableObject-reference concerns that don't apply here (everything in this file is already plain JSON). */
export interface SaveGameData {
  schemaVersion: number
  savedAtUnixMs: number

  year: number
  month: number
  day: number

  cashBalance: number
  loans: LoanState[]

  companyName: string
  homeCity: string
  reputationPercent: number
  marketSharePercent: number
  populationServed: number
  autoReleasedCount: number
  totalCarsSoldAllModels: number
  lifetimeEarnings: number
  daysInsolvent: number
  isBankrupt: boolean

  researchPoints: number
  researchNodes: ResearchNodeSaveEntry[]

  staffBudgetLevel01: number
  staffExperienceLevel: number
  staffExperienceProgress01: number

  models: CarModel[]
  tooledBodyIds: string[]

  racingRegistered: boolean
  racingTeamName: string
}

// Bumped for the classificationTagIds/componentSelections/enginePresetId fields the car design
// wizard rebuild added to CarModel. No migration path - saves from an older schema are treated as
// absent and the player starts fresh (acceptable pre-1.0; see isCompatibleSave).
const CURRENT_SCHEMA_VERSION = 3

export function isCompatibleSave(data: SaveGameData): boolean {
  return data.schemaVersion === CURRENT_SCHEMA_VERSION
}

export function buildSaveData(world: World): SaveGameData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    savedAtUnixMs: Date.now(),

    year: world.time.currentDate.year,
    month: world.time.currentDate.month,
    day: world.time.currentDate.day,

    cashBalance: world.bank.balance,
    loans: world.bank.loans,

    companyName: world.company.companyName,
    homeCity: world.company.homeCity,
    reputationPercent: world.company.reputationPercent,
    marketSharePercent: world.company.marketSharePercent,
    populationServed: world.company.populationServed,
    autoReleasedCount: world.company.autoReleasedCount,
    totalCarsSoldAllModels: world.company.totalCarsSoldAllModels,
    lifetimeEarnings: world.company.lifetimeEarnings,
    daysInsolvent: world.company.daysInsolvent,
    isBankrupt: world.company.isBankrupt,

    researchPoints: world.research.points,
    researchNodes: Object.entries(world.research.nodeRuntime).map(([nodeId, r]) => ({
      nodeId,
      started: r.started,
      isBreakthrough: r.isBreakthrough,
      progress: r.progress01,
      researched: r.researched,
    })),

    staffBudgetLevel01: world.staff.budgetLevel01,
    staffExperienceLevel: world.staff.experienceLevel,
    staffExperienceProgress01: world.staff.experienceProgress01,

    models: world.vehicles.models,
    tooledBodyIds: world.vehicles.tooledBodyIds,

    racingRegistered: world.racing.isRegistered,
    racingTeamName: world.racing.teamName,
  }
}

/** Builds a fresh World and restores it to match `data`. */
export function loadWorld(config: GameConfig, catalog: Catalog, data: SaveGameData): World {
  const world = createNewWorld(config)

  world.time.currentDate = makeDate(data.year, data.month, data.day)
  world.bank.balance = data.cashBalance
  world.bank.loans = data.loans

  world.company.companyName = data.companyName
  world.company.homeCity = data.homeCity
  world.company.reputationPercent = data.reputationPercent
  world.company.marketSharePercent = data.marketSharePercent
  world.company.populationServed = data.populationServed
  world.company.autoReleasedCount = data.autoReleasedCount
  world.company.totalCarsSoldAllModels = data.totalCarsSoldAllModels
  world.company.lifetimeEarnings = data.lifetimeEarnings
  world.company.daysInsolvent = data.daysInsolvent
  world.company.isBankrupt = data.isBankrupt

  world.research.points = data.researchPoints
  for (const entry of data.researchNodes) {
    world.research.nodeRuntime[entry.nodeId] = {
      started: entry.started,
      isBreakthrough: entry.isBreakthrough,
      progress01: entry.progress,
      researched: entry.researched,
    }
    if (entry.researched) {
      const node = catalog.researchNodes.find((n) => n.id === entry.nodeId)
      if (node) world.research.modifiers.apply(node.effects)
    }
  }

  world.staff.budgetLevel01 = data.staffBudgetLevel01
  world.staff.experienceLevel = data.staffExperienceLevel
  world.staff.experienceProgress01 = data.staffExperienceProgress01

  world.vehicles.models = data.models
  world.vehicles.tooledBodyIds = data.tooledBodyIds

  world.racing.isRegistered = data.racingRegistered
  world.racing.teamName = data.racingTeamName

  return world
}

/** Minimal storage interface so save/load is testable without a DOM - defaults to the browser's localStorage but accepts an in-memory mock in tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** How many concurrent companies a player can have going at once - shown as 3 slots on the Save
 * Slots screen. Picked as a small, fixed number rather than unlimited slots so that screen (and
 * "which slot does a new game land in") stays a simple, fully-visible list instead of needing its
 * own scrolling/management UI. */
export const SAVE_SLOT_COUNT = 3

const LEGACY_STORAGE_KEY = 'pistons.save.v1'
const slotKey = (slotIndex: number) => `pistons.save.v1.slot${slotIndex}`

function defaultStorage(): KeyValueStorage | undefined {
  return typeof localStorage !== 'undefined' ? localStorage : undefined
}

export function saveToStorage(
  data: SaveGameData,
  storage: KeyValueStorage | undefined = defaultStorage(),
  slotIndex = 0,
): void {
  if (!storage) return
  data.savedAtUnixMs = Date.now()
  try {
    storage.setItem(slotKey(slotIndex), JSON.stringify(data))
  } catch (e) {
    console.error('[save] Failed to write save data:', e)
  }
}

export function tryLoadFromStorage(
  storage: KeyValueStorage | undefined = defaultStorage(),
  slotIndex = 0,
): SaveGameData | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(slotKey(slotIndex))
    if (!raw) return null
    return JSON.parse(raw) as SaveGameData
  } catch (e) {
    console.error('[save] Save data is corrupt, ignoring:', e)
    return null
  }
}

export function clearStorage(storage: KeyValueStorage | undefined = defaultStorage(), slotIndex = 0): void {
  if (!storage) return
  storage.removeItem(slotKey(slotIndex))
}

/** Every slot's save data in order, or null for a slot that's empty, corrupt, or from an
 * incompatible schema (treated the same as empty - see isCompatibleSave). Read fresh from storage
 * each call rather than cached, since it's cheap and this only runs on menu-ish screens. */
export function listSlots(storage: KeyValueStorage | undefined = defaultStorage()): (SaveGameData | null)[] {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => {
    const data = tryLoadFromStorage(storage, i)
    return data && isCompatibleSave(data) ? data : null
  })
}

/** One-time upgrade for anyone with a save from before slots existed: if slot 0 is still empty and
 * the old fixed-key save is there, it becomes slot 0 instead of silently vanishing. No-op for a
 * player who's never saved, or who's already on the slot system (slot 0 already occupied, or the
 * legacy key already cleared). Call once at store bootstrap, before anything reads slot data. */
export function migrateLegacySaveIfNeeded(storage: KeyValueStorage | undefined = defaultStorage()): void {
  if (!storage) return
  if (storage.getItem(slotKey(0))) return
  const legacy = storage.getItem(LEGACY_STORAGE_KEY)
  if (!legacy) return
  storage.setItem(slotKey(0), legacy)
  storage.removeItem(LEGACY_STORAGE_KEY)
}
