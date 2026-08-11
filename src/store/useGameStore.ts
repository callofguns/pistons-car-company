import { create } from 'zustand'
import { CATALOG } from '../data/catalog'
import { LOAN_TIERS } from '../data/loanTiers'
import type { Catalog } from '../core/catalog'
import { DEFAULT_GAME_CONFIG, type GameConfig } from '../core/gameConfig'
import { createNewWorld, tickWorld, notifyResearchProgressed, type World } from '../core/world'
import { buildSaveData, clearStorage, isCompatibleSave, loadWorld, saveToStorage, tryLoadFromStorage } from '../core/save'
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
  setCustomPrice as coreSetCustomPrice,
  setEngineSpec as coreSetEngineSpec,
  setNameAndCategory as coreSetNameAndCategory,
  setOnSale as coreSetOnSale,
  setSalePrice as coreSetSalePrice,
} from '../core/vehicleService'
import type { EngineSpec } from '../core/vehicles'

function bootstrapWorld(config: GameConfig, catalog: Catalog): World {
  const saved = tryLoadFromStorage()
  // A save from an older schema (e.g. pre-loans/bankruptcy) is treated as absent rather than
  // partially restored - see save.ts's isCompatibleSave for why there's no migration path yet.
  return saved && isCompatibleSave(saved) ? loadWorld(config, catalog, saved) : createNewWorld(config)
}

interface GameStore {
  config: GameConfig
  catalog: Catalog
  world: World
  /** Bumped on every mutation - the store's equivalent of GameEvents; components subscribe to this (or a value derived from it) to know when to re-read `world`. */
  revision: number

  tick: (deltaSeconds: number) => void
  saveNow: () => void
  startNewGame: () => void
  setPaused: (paused: boolean) => void

  beginNewDesign: () => void
  beginRestyling: (modelId: string) => void
  selectBody: (bodyId: string) => boolean
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

  const bump = () => set((s) => ({ revision: s.revision + 1 }))
  const findModel = (world: World, modelId: string) => world.vehicles.models.find((m) => m.id === modelId)

  return {
    config,
    catalog,
    world: bootstrapWorld(config, catalog),
    revision: 0,

    tick: (deltaSeconds) => {
      const { world, catalog, config } = get()
      const daysElapsed = tickWorld(world, catalog, config, deltaSeconds)
      if (daysElapsed > 0) {
        if (world.time.currentDate.day === 1 && config.autosaveOnMonthRollover) {
          saveToStorage(buildSaveData(world))
        }
        bump()
      }
    },

    saveNow: () => saveToStorage(buildSaveData(get().world)),

    setPaused: (paused) => {
      get().world.time.isPaused = paused
    },

    startNewGame: () => {
      clearStorage()
      set({ world: createNewWorld(get().config), revision: get().revision + 1 })
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
      const ok = coreSelectBody(world.vehicles, body, world.bank)
      bump()
      return ok
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
