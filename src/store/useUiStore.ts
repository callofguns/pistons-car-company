import { create } from 'zustand'
import type { ScreenId } from './screenId'

/** Screens with no persistent top HUD bar - Main Menu and the Office Hub (the true home screen), matching the reference screenshots exactly (neither shows the reputation/population/date pill row). */
const SCREENS_WITHOUT_HUD = new Set<ScreenId>(['MainMenu', 'OfficeHub'])

export function screenWantsTopHud(screen: ScreenId): boolean {
  return !SCREENS_WITHOUT_HUD.has(screen)
}

/** Screen titles shown in the HUD's top-left, matching the reference ("BODY SELECTION", "SALES STATISTICS", etc.). */
export const SCREEN_TITLES: Record<ScreenId, string> = {
  MainMenu: 'Main Menu',
  OfficeHub: 'Office',
  BodySelection: 'Body Selection',
  EngineDesign: 'Engine Design',
  StylePricing: 'Style & Pricing',
  ModelLineup: 'Model Lineup',
  SalesStatistics: 'Sales Statistics',
  Research: 'Research',
  Employees: 'Employees',
  Promotion: 'Promotion',
  Company: 'Company',
  TeamCreation: 'Team Creation',
  Bank: 'Finance',
}

interface UiStore {
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
