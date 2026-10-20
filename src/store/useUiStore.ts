import { create } from 'zustand'
import type { ScreenId } from './screenId'
import type { MessageKey } from '../i18n/keys'

/** Main Menu is the title screen, before a session is really "in progress" - the persistent stat
 * bar was asked to come back off of it specifically. Every in-game screen, including Office Hub,
 * Body Selection and the design wizard (like the reference), keeps it. */
const SCREENS_WITHOUT_HUD = new Set<ScreenId>([
  'MainMenu',
  'CompanyNaming',
  'SaveSlots',
  // Reachable from the Main Menu, where world is a blank unsaved createNewWorld() - the HUD would
  // otherwise render stats (company name, cash, date) for a company that doesn't exist. News is
  // also reachable from Office Hub with a real world loaded, but SCREENS_WITHOUT_HUD is per-screen
  // not per-context, and this screen has its own back button either way (see NewsScreen.tsx).
  'News',
])

export function screenWantsTopHud(screen: ScreenId): boolean {
  return !SCREENS_WITHOUT_HUD.has(screen)
}

/** Screen titles shown in the HUD's top-left, matching the reference ("BODY SELECTION", "SALES
 * STATISTICS", etc.) - message keys, not raw strings, so TopHud renders them through the current
 * locale via t(). A Record<ScreenId, MessageKey>, same as SCREENS in screens/index.ts, so adding a
 * new screen without an entry here is a compile error. */
export const SCREEN_TITLE_KEYS: Record<ScreenId, MessageKey> = {
  MainMenu: 'screen.mainMenu.title',
  CompanyNaming: 'screen.companyNaming.title',
  SaveSlots: 'screen.saveSlots.title',
  OfficeHub: 'screen.officeHub.title',
  BodySelection: 'screen.bodySelection.title',
  CarDesign: 'screen.carDesign.title',
  ModelLineup: 'screen.modelLineup.title',
  SalesStatistics: 'screen.salesStatistics.title',
  Research: 'screen.research.title',
  Employees: 'screen.employees.title',
  Promotion: 'screen.promotion.title',
  Company: 'screen.company.title',
  TeamCreation: 'screen.teamCreation.title',
  Bank: 'screen.bank.title',
  RaceEntry: 'screen.raceEntry.title',
  // Not actually shown - it's in SCREENS_WITHOUT_HUD - but this is a
  // Record<ScreenId, MessageKey>, so every screen needs an entry regardless.
  News: 'news.screenTitle',
  Factory: 'screen.factory.title',
  Rivals: 'screen.rivals.title',
  Goals: 'screen.goals.title',
}

/** Lets a screen with its own internal steps (the design wizard) take over the top bar's title
 * and back arrow, so Back walks back through its steps instead of leaving the screen. */
export interface HudOverride {
  menuLabel: string
  title: string
  onBack: () => void
}

interface UiStore {
  hudOverride: HudOverride | null
  setHudOverride: (override: HudOverride | null) => void
  currentScreen: ScreenId
  /** Optional navigation context, e.g. a CarModel id to jump straight to in Sales Statistics or Model Lineup. */
  payload: unknown
  history: ScreenId[]

  show: (screen: ScreenId, payload?: unknown) => void
  replace: (screen: ScreenId, payload?: unknown) => void
  back: () => void
  goHome: (homeScreen: ScreenId) => void
  canGoBack: () => boolean
}

/**
 * Screen navigation: current screen, an optional payload, and a back-stack. Direct port of
 * UIRouter.cs's Show/Back/GoHome API onto a Zustand store instead of a MonoBehaviour.
 */
export const useUiStore = create<UiStore>((set, get) => ({
  hudOverride: null,
  setHudOverride: (hudOverride) => set({ hudOverride }),
  currentScreen: 'MainMenu',
  payload: undefined,
  history: [],

  show: (screen, payload) =>
    set((state) => ({
      currentScreen: screen,
      payload,
      history: [...state.history, state.currentScreen],
    })),

  replace: (screen, payload) => set({ currentScreen: screen, payload, history: [] }),

  back: () => {
    const { history } = get()
    if (history.length === 0) return
    const previous = history[history.length - 1]
    set({ currentScreen: previous, payload: undefined, history: history.slice(0, -1) })
  },

  goHome: (homeScreen) => set({ currentScreen: homeScreen, payload: undefined, history: [] }),

  canGoBack: () => get().history.length > 0,
}))
