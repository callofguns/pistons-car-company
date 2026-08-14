import { create } from 'zustand'
import type { ScreenId } from './screenId'

/** Main Menu is the title screen, before a session is really "in progress" - the persistent stat
 * bar was asked to come back off of it specifically. The whole car-building process (Body
 * Selection through the design wizard) also runs full-screen without it, as its own focused,
 * distraction-free flow - both screens own their own in-screen back navigation, so nothing is
 * lost by dropping the bar there. Every other screen, including Office Hub, keeps it visible. */
const SCREENS_WITHOUT_HUD = new Set<ScreenId>([
  'MainMenu',
  'CompanyNaming',
  'SaveSlots',
  'BodySelection',
  'CarDesign',
  // Reachable from the Main Menu, where world is a blank unsaved createNewWorld() - the HUD would
  // otherwise render stats (company name, cash, date) for a company that doesn't exist.
  'Language',
])

export function screenWantsTopHud(screen: ScreenId): boolean {
  return !SCREENS_WITHOUT_HUD.has(screen)
}

/** Screen titles shown in the HUD's top-left, matching the reference ("BODY SELECTION", "SALES STATISTICS", etc.). */
export const SCREEN_TITLES: Record<ScreenId, string> = {
  MainMenu: 'Main Menu',
  CompanyNaming: 'New Company',
  SaveSlots: 'Save Slots',
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
  // Not actually shown - Language is in SCREENS_WITHOUT_HUD - but SCREEN_TITLES is a
  // Record<ScreenId, string>, so every screen needs an entry regardless.
  Language: 'Language',
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
