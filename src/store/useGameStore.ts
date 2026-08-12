import { create } from 'zustand'
import { CATALOG } from '../data/catalog'
import { LOAN_TIERS } from '../data/loanTiers'
import type { Catalog } from '../core/catalog'
import { DEFAULT_GAME_CONFIG, type GameConfig } from '../core/gameConfig'
import { createNewWorld, tickWorld, notifyResearchProgressed, type World } from '../core/world'
import {
  buildSaveData,
  isCompatibleSave,
  loadWorld,
  migrateLegacySaveIfNeeded,
  saveToStorage,
  tryLoadFromStorage,
} from '../core/save'
import { takeLoan as coreTakeLoan } from '../core/economy'
import { startResearch as coreStartResearch } from '../core/research'
import { maxProductionBatch, setBudgetLevel as coreSetBudgetLevel } from '../core/staff'
import { startCampaign as coreStartCampaign } from '../core/marketing'
import { registerTeam as coreRegisterTeam } from '../core/racing'
import {
  beginNewDesign as coreBeginNewDesign,
  beginRestyling as coreBeginRestyling,
  extendProductionRun as coreExtendProductionRun,
  finalizeDesign as coreFinalizeDesign,
  previewCurrentStats as corePreviewCurrentStats,
  selectBody as coreSelectBody,
  setComponentSelection as coreSetComponentSelection,
  setCustomPrice as coreSetCustomPrice,
  setEnginePreset as coreSetEnginePreset,
  setEngineSpec as coreSetEngineSpec,
  setNameAndCategory as coreSetNameAndCategory,
  setOnSale as coreSetOnSale,
  setSalePrice as coreSetSalePrice,
  toggleClassificationTag as coreToggleClassificationTag,
} from '../core/vehicleService'
import type { EngineSpec } from '../core/vehicles'

interface GameStore {
  config: GameConfig
  catalog: Catalog
  world: World
  /** Bumped on every mutation - the store's equivalent of GameEvents; components subscribe to this (or a value derived from it) to know when to re-read `world`. */
  revision: number
  /** Which save slot `world` came from/belongs to - null until the player has actually started or
   * loaded a game (Main Menu boots with a blank, unsaved world nobody can reach without going
   * through Company Naming or Save Slots first). saveNow() and the autosave tick both write here,
   * so this is what makes "which slot am I even playing" unambiguous. */
  activeSlotIndex: number | null

  tick: (deltaSeconds: number) => void
  saveNow: () => void
  /** Starts a brand-new company in the given slot (overwriting whatever was there) and makes it
   * the active game. Used by the Company Naming / Save Slots screens. */
  startNewGameInSlot: (slotIndex: number, companyName: string) => void
  /** Loads a slot's save into play. Returns false (and leaves the current game untouched) if that
   * slot turns out to be empty or incompatible - shouldn't happen from the Save Slots screen,
   * which only offers slots listSlots() already confirmed are loadable, but this stays safe either way. */
  loadSlot: (slotIndex: number) => boolean
  /** BankruptcyOverlay's "+ START NEW GAME" - restarts fresh in the same slot under the same
   * company name, rather than sending a mid-run player back through the naming/slot-picker flow. */
  restartAfterBankruptcy: () => void
  /** 'paused' stops the clock outright; 'normal'/'fast' resume at speedMultiplier 1x/3x. Persists
   * across screen changes as world.time.manuallyPaused - see useSimulationLoop for how this
   * combines with the screen-based auto-pause gate. */
  setPlaybackSpeed: (speed: 'paused' | 'normal' | 'fast') => void

  beginNewDesign: () => void
  beginRestyling: (modelId: string) => void
  selectBody: (bodyId: string) => boolean
  toggleClassificationTag: (tagId: string) => void
  setComponentSelection: (slotId: string, optionId: string) => void
  setEnginePreset: (presetId: string) => void
  setEngineSpec: (spec: EngineSpec) => void
  setNameAndCategory: (name: string, categoryTag: string) => void
  setCustomPrice: (price: number) => void
  finalizeDesign: () => string | null // returns the new model's id, or null on failure
  previewCurrentStats: () => ReturnType<typeof corePreviewCurrentStats>

  setOnSale: (modelId: string, onSale: boolean) => void
  setSalePrice: (modelId: string, price: number) => void
  extendProductionRun: (modelId: string, additionalUnits: number) => void

  startResearch: (nodeId: string) => boolean

  setBudgetLevel: (level01: number) => void

  startCampaign: (modelId: string, tierId: string) => boolean

  registerTeam: (teamName: string) => boolean

  takeLoan: (tierId: string) => boolean
}

export const useGameStore = create<GameStore>((set, get) => {
  const config = DEFAULT_GAME_CONFIG
  const catalog = CATALOG

  // Runs once, before anything (Main Menu's Continue-button check, Save Slots' listing) reads
  // slot data - see save.ts's migrateLegacySaveIfNeeded for why.
  migrateLegacySaveIfNeeded()

  const bump = () => set((s) => ({ revision: s.revision + 1 }))
  const findModel = (world: World, modelId: string) => world.vehicles.models.find((m) => m.id === modelId)

  return {
    config,
    catalog,
    // Blank and unsaved until the player actually starts or loads a game - Main Menu boots to
    // the title screen regardless of what's in `world`, so there's nothing to accidentally show.
    world: createNewWorld(config),
    revision: 0,
    activeSlotIndex: null,

    tick: (deltaSeconds) => {
      const { world, catalog, config, activeSlotIndex } = get()
      const daysElapsed = tickWorld(world, catalog, config, deltaSeconds)
      if (daysElapsed > 0) {
        if (world.time.currentDate.day === 1 && config.autosaveOnMonthRollover && activeSlotIndex !== null) {
          saveToStorage(buildSaveData(world), undefined, activeSlotIndex)
        }
        bump()
      }
    },

    saveNow: () => {
      const { world, activeSlotIndex } = get()
      if (activeSlotIndex === null) return // nothing to save into yet
      saveToStorage(buildSaveData(world), undefined, activeSlotIndex)
    },

    startNewGameInSlot: (slotIndex, companyName) => {
      const world = createNewWorld(get().config, companyName)
      saveToStorage(buildSaveData(world), undefined, slotIndex)
      set((s) => ({ world, activeSlotIndex: slotIndex, revision: s.revision + 1 }))
    },

    loadSlot: (slotIndex) => {
      const { config, catalog } = get()
      const data = tryLoadFromStorage(undefined, slotIndex)
      if (!data || !isCompatibleSave(data)) return false
      const world = loadWorld(config, catalog, data)
      set((s) => ({ world, activeSlotIndex: slotIndex, revision: s.revision + 1 }))
      return true
    },

    restartAfterBankruptcy: () => {
      const { config, world, activeSlotIndex } = get()
      const freshWorld = createNewWorld(config, world.company.companyName)
      const slot = activeSlotIndex ?? 0
      saveToStorage(buildSaveData(freshWorld), undefined, slot)
      set((s) => ({ world: freshWorld, activeSlotIndex: slot, revision: s.revision + 1 }))
    },

    setPlaybackSpeed: (speed) => {
      const time = get().world.time
      time.manuallyPaused = speed === 'paused'
      time.speedMultiplier = speed === 'fast' ? 3 : 1
      bump()
    },

    beginNewDesign: () => {
      coreBeginNewDesign(get().world.vehicles)
      bump()
    },

    beginRestyling: (modelId) => {
      const { world } = get()
      const model = findModel(world, modelId)
      if (model) coreBeginRestyling(world.vehicles, model)
      bump()
    },

    selectBody: (bodyId) => {
      const { world, catalog } = get()
      const body = catalog.bodies.find((b) => b.id === bodyId)
      if (!body) return false
      const ok = coreSelectBody(world.vehicles, body, world.bank, world.time.currentDate.year)
      bump()
      return ok
    },

    toggleClassificationTag: (tagId) => {
      coreToggleClassificationTag(get().world.vehicles, tagId)
      bump()
    },

    setComponentSelection: (slotId, optionId) => {
      coreSetComponentSelection(get().world.vehicles, slotId, optionId)
      bump()
    },

    setEnginePreset: (presetId) => {
      coreSetEnginePreset(get().world.vehicles, presetId)
      bump()
    },

    setEngineSpec: (spec) => {
      coreSetEngineSpec(get().world.vehicles, spec)
      bump()
    },

    setNameAndCategory: (name, categoryTag) => {
      coreSetNameAndCategory(get().world.vehicles, name, categoryTag)
      bump()
    },

    setCustomPrice: (price) => {
      coreSetCustomPrice(get().world.vehicles, price)
      bump()
    },

    finalizeDesign: () => {
      const { world, catalog } = get()
      const model = coreFinalizeDesign(
        world.vehicles,
        catalog.bodies,
        world.research.modifiers,
        world.time.currentDate,
        maxProductionBatch(world.staff),
      )
      bump()
      return model?.id ?? null
    },

    previewCurrentStats: () => {
      const { world, catalog } = get()
      return corePreviewCurrentStats(world.vehicles, catalog.bodies, world.research.modifiers)
    },

    setOnSale: (modelId, onSale) => {
      const model = findModel(get().world, modelId)
      if (model) coreSetOnSale(model, onSale)
      bump()
    },

    setSalePrice: (modelId, price) => {
      const model = findModel(get().world, modelId)
      if (model) coreSetSalePrice(model, price)
      bump()
    },

    extendProductionRun: (modelId, additionalUnits) => {
      const model = findModel(get().world, modelId)
      if (model) coreExtendProductionRun(model, additionalUnits)
      bump()
    },

    startResearch: (nodeId) => {
      const { world, catalog } = get()
      const node = catalog.researchNodes.find((n) => n.id === nodeId)
      if (!node) return false
      const ok = coreStartResearch(world.research, node, world.bank, world.time.currentDate.year)
      if (ok) notifyResearchProgressed(world, catalog)
      bump()
      return ok
    },

    setBudgetLevel: (level01) => {
      coreSetBudgetLevel(get().world.staff, level01)
      bump()
    },

    startCampaign: (modelId, tierId) => {
      const { world, catalog } = get()
      const model = findModel(world, modelId)
      const tier = catalog.promotionTiers.find((t) => t.id === tierId)
      if (!model || !tier) return false
      const ok = coreStartCampaign(model, tier, world.bank, world.time.currentDate.year)
      bump()
      return ok
    },

    registerTeam: (teamName) => {
      const { world, config } = get()
      const ok = coreRegisterTeam(world.racing, teamName, world.bank, world.time.currentDate.year, config.racingUnlockYear)
      bump()
      return ok
    },

    takeLoan: (tierId) => {
      const tier = LOAN_TIERS.find((t) => t.id === tierId)
      if (!tier) return false
      const { world } = get()
      coreTakeLoan(world.bank, world.ledger, tier.principal, tier.annualInterestRate, tier.termMonths, world.time.currentDate)
      bump()
      return true
    },
  }
})
