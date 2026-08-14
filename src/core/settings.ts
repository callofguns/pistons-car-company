import type { KeyValueStorage } from './save'

/**
 * Device-level preferences - currently just the player's chosen language. Deliberately separate
 * from SaveGameData (src/core/save.ts): language is a device preference shared across all 3 save
 * slots, not per-company data, so it lives under its own storage key rather than inside a save.
 *
 * Mirrors save.ts's pure-persistence / Zustand-store split (see useSettingsStore.ts) and reuses
 * its injectable KeyValueStorage interface, so this is testable with the same in-memory storage
 * mock tests already use (tests/helpers/memoryStorage.ts) without touching localStorage.
 */
export interface PersistedSettings {
  locale: string
}

const SETTINGS_STORAGE_KEY = 'pistons.settings.v1'

function defaultStorage(): KeyValueStorage | undefined {
  return typeof localStorage !== 'undefined' ? localStorage : undefined
}

export function loadSettings(storage: KeyValueStorage | undefined = defaultStorage()): PersistedSettings | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedSettings
  } catch (e) {
    console.error('[settings] Settings data is corrupt, ignoring:', e)
    return null
  }
}

export function saveSettings(settings: PersistedSettings, storage: KeyValueStorage | undefined = defaultStorage()): void {
  if (!storage) return
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('[settings] Failed to write settings data:', e)
  }
}
