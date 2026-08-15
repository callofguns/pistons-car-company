import type { Catalog } from './catalog'
import type { LoanState } from './economy'
import type { GameConfig } from './gameConfig'
import { makeDate } from './gameDate'
import { createNewWorld, type World } from './world'
import type { CarModel } from './vehicles'
import type { NewsEntry } from './news'
import type { RaceResultRecord, RacingState } from './racing'
import type { Employee } from './staff'

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

  // Superseded by the individual-employee roster below (staffEmployees/staffCandidates) -
  // buildSaveData no longer writes these, but they stay optional (not removed outright) so an
  // older save that still has them parses as valid JSON; loadWorld simply never reads them.
  staffBudgetLevel01?: number
  staffExperienceLevel?: number
  staffExperienceProgress01?: number

  models: CarModel[]
  tooledBodyIds: string[]

  racingRegistered: boolean
  racingTeamName: string

  // Optional and read defensively (`data.news ?? []` in loadWorld) rather than bumping
  // CURRENT_SCHEMA_VERSION - see isCompatibleSave's doc comment on why that's the one thing NOT
  // to do here (it's a strict === with no migration path, so bumping it silently deletes every
  // existing save). A pre-News save simply loads with an empty feed instead of "Empty Slot".
  news?: NewsEntry[]

  // Same optional-field treatment as `news` above, added for the race-entry/history feature - a
  // pre-racing save loads with no pending entry and an empty history instead of losing the slot.
  racingPendingEntry?: RacingState['pendingEntry']
  racingHistory?: RaceResultRecord[]
  racingRngState?: number

  // Same optional-field treatment, added for the individual-employee roster/HQ leveling feature -
  // a pre-roster save loads with the same default starting roster createStaffState() builds (see
  // loadWorld) and HQ level 1, rather than losing the slot or landing on an empty payroll.
  hqLevel?: number
  staffEmployees?: Employee[]
  staffCandidates?: Employee[]
  staffRngState?: number
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

    models: world.vehicles.models,
    tooledBodyIds: world.vehicles.tooledBodyIds,

    racingRegistered: world.racing.isRegistered,
    racingTeamName: world.racing.teamName,

    news: world.news.entries,

    racingPendingEntry: world.racing.pendingEntry,
    racingHistory: world.racing.history,
    racingRngState: world.racing.rngState,

    hqLevel: world.company.hqLevel,
    staffEmployees: world.staff.employees,
    staffCandidates: world.staff.candidates,
    staffRngState: world.staff.rngState,
  }
}

/** Builds a fresh World and restores it to match `data`. */
export function loadWorld(config: GameConfig, catalog: Catalog, data: SaveGameData): World {
  const world = createNewWorld(config, catalog)

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

  // A pre-roster save (data.staffEmployees undefined) keeps whatever createNewWorld's own
  // createStaffState() call already seeded onto world.staff above - the same default starting
  // roster/candidate pool a brand-new company gets - rather than landing the player on an empty
  // payroll with no way to hire anyone back.
  if (data.staffEmployees) world.staff.employees = data.staffEmployees
  if (data.staffCandidates) world.staff.candidates = data.staffCandidates
  world.staff.rngState = data.staffRngState ?? world.staff.rngState

  world.company.hqLevel = data.hqLevel ?? 1

  world.vehicles.models = data.models
  world.vehicles.tooledBodyIds = data.tooledBodyIds

  world.racing.isRegistered = data.racingRegistered
  world.racing.teamName = data.racingTeamName
  world.racing.pendingEntry = data.racingPendingEntry ?? null
  world.racing.history = data.racingHistory ?? []
  world.racing.rngState = data.racingRngState ?? world.racing.rngState

  world.news.entries = data.news ?? []

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
