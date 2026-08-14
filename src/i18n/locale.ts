/**
 * Locale metadata - the one place that knows which locales this build ships. Deliberately tiny
 * and separate from keys.ts/t.ts: this file has zero dependency on the message catalogs, so
 * anything that only needs "which locales exist" (the Language screen's button list, the initial-
 * locale resolver below) doesn't need to import ~350 translated strings to do it.
 */
export type Locale = 'en' | 'es' | 'fr'

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'es', 'fr']

export const DEFAULT_LOCALE: Locale = 'en'

/** Shown on the Language screen, in the language itself (its endonym) - never translated into the
 * currently-active locale. That's the standard convention (a Spanish speaker looks for "Español",
 * not whatever French calls Spanish) and it has a nice side effect here: this list renders
 * byte-identical regardless of which locale is currently active, so nothing shifts on switch. */
export const LOCALE_ENDONYMS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** Persisted choice if valid, else the closest match to the browser's language, else the default.
 * Guarded with `typeof navigator` so this stays callable from the node-only vitest environment
 * (src/core/'s pure-logic tests import nothing from here, but src/i18n/'s own tests do). */
export function resolveInitialLocale(persisted: string | undefined): Locale {
  if (persisted && isSupportedLocale(persisted)) return persisted

  if (typeof navigator !== 'undefined' && navigator.language) {
    const prefix = navigator.language.slice(0, 2).toLowerCase()
    if (isSupportedLocale(prefix)) return prefix
  }

  return DEFAULT_LOCALE
}
