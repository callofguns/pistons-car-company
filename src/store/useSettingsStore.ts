import { create } from 'zustand'
import { loadSettings, saveSettings } from '../core/settings'
import { resolveInitialLocale, type Locale } from '../i18n/locale'
import { getRumorTemplates } from '../i18n/rumors'
import { useGameStore } from './useGameStore'

interface SettingsStore {
  locale: Locale
  setLocale: (locale: Locale) => void

  /** Dev-only pseudo-locale toggle (see src/i18n/pseudo.ts) - never persisted, always false on a
   * fresh load, and only ever surfaced in the UI behind an import.meta.env.DEV guard. */
  pseudoEnabled: boolean
  setPseudoEnabled: (enabled: boolean) => void
}

/**
 * Device-level preferences, parallel to useGameStore/save.ts but deliberately its own store: a
 * language choice is per-device, not per-company, so it lives outside the 3 save slots under its
 * own storage key (see core/settings.ts) rather than inside SaveGameData.
 *
 * No zustand `persist` middleware - the codebase uses zero middleware anywhere, and `persist`
 * can't consume the injectable KeyValueStorage interface the rest of this app's persistence goes
 * through (save.ts:154) without a shim. Reading once on create and writing on every setLocale is
 * simpler and keeps this testable with the same in-memory storage mock save.test.ts already uses.
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  locale: resolveInitialLocale(loadSettings()?.locale),

  setLocale: (locale) => {
    saveSettings({ locale })
    if (typeof document !== 'undefined') document.documentElement.lang = locale

    // Rumors are pre-rendered strings, not persisted (see core/company.ts's RumorState doc
    // comment) - unlike News, there's no structured data to re-translate in place, so a language
    // switch just swaps in the new locale's phrase bank for future rumors and clears the old
    // ones. Acceptable: it's unpersisted flavor gossip, not anything the player would notice
    // "losing" the way they'd notice a renamed car model.
    const game = useGameStore.getState()
    game.world.rumors.recent = []
    useGameStore.setState((s) => ({
      catalog: { ...s.catalog, rumorTemplates: getRumorTemplates(locale) },
      revision: s.revision + 1,
    }))

    set({ locale })
  },

  pseudoEnabled: false,
  setPseudoEnabled: (pseudoEnabled) => set({ pseudoEnabled }),
}))
