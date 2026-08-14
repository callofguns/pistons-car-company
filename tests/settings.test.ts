import { describe, expect, it } from 'vitest'
import { loadSettings, saveSettings } from '../src/core/settings'
import { resolveInitialLocale } from '../src/i18n/locale'
import { createMemoryStorage } from './helpers/memoryStorage'

describe('settings persistence', () => {
  it('round-trips a saved locale', () => {
    const storage = createMemoryStorage()
    saveSettings({ locale: 'fr' }, storage)
    expect(loadSettings(storage)).toEqual({ locale: 'fr' })
  })

  it('returns null when nothing has been saved yet', () => {
    const storage = createMemoryStorage()
    expect(loadSettings(storage)).toBeNull()
  })

  it('does not throw on corrupt JSON, and returns null', () => {
    const storage = createMemoryStorage()
    storage.setItem('pistons.settings.v1', '{not json')
    expect(loadSettings(storage)).toBeNull()
  })

  it('overwrites a previously saved locale', () => {
    const storage = createMemoryStorage()
    saveSettings({ locale: 'es' }, storage)
    saveSettings({ locale: 'en' }, storage)
    expect(loadSettings(storage)).toEqual({ locale: 'en' })
  })
})

describe('resolveInitialLocale', () => {
  it('prefers a valid persisted locale', () => {
    expect(resolveInitialLocale('fr')).toBe('fr')
  })

  it('falls back to en for an unknown persisted value', () => {
    // Node exposes a navigator global too (navigator.language is typically 'en-US' in CI), so
    // this can land on 'en' via either the browser-language fallback or the final default - both
    // are the correct outcome for an unsupported persisted locale like German.
    expect(resolveInitialLocale('de')).toBe('en')
  })

  it('falls back to en when nothing was persisted', () => {
    expect(resolveInitialLocale(undefined)).toBe('en')
  })
})
