import { create } from 'zustand'
import type { ScreenId } from './screenId'

/** The persistent top HUD (reputation/population/day/date pills) is shown on every screen, so
 * the player's standing is always visible, not just while inside a sub-menu. Previously hidden on
 * Main Menu and Office Hub to match the reference screenshots exactly, but always-visible is what
 * was asked for. */
export function screenWantsTopHud(_screen: ScreenId): boolean {
  return true
}

/** Screen titles shown in the HUD's top-left, matching the reference ("BODY SELECTION", "SALES STATISTICS", etc.). */
export const SCREEN_TITLES: Record<ScreenId, string> = {
  MainMenu: 'Main Menu',
  OfficeHub: 'Office',
  BodySelection: 'Body Selection',
  CarDesign: 'Car Design',
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
