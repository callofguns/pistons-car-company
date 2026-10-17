import { useMemo } from 'react'
import { translate, plural, type VarsFor } from './t'
import { formattersFor } from './format'
import { DEFAULT_LOCALE } from './locale'
import type { MessageKey, PluralKey } from './keys'

/**
 * The one hook components use for all text and number rendering: `t()` for strings, `tp()` for
 * pluralized strings, `fmt` for numbers/dates. English-only now, so this never changes between
 * renders - kept as a hook so call sites stay the same if a language is ever added back.
 */
export function useT() {
  return useMemo(() => {
    const locale = DEFAULT_LOCALE

    // Two overloads mirroring translate()'s own two in t.ts: a literal key gets VarsFor<K>'s full
    // compile-time check, a dynamically-built key (only known as the general MessageKey union at
    // its call site, e.g. SCREEN_TITLE_KEYS[currentScreen]) falls through to plain optional vars.
    function t<K extends MessageKey>(key: K, ...args: VarsFor<K>): string
    function t(key: MessageKey, vars?: Record<string, string | number>): string
    function t(key: MessageKey, vars?: Record<string, string | number>): string {
      return translate(locale, key, vars)
    }

    function tp<K extends PluralKey>(key: K, count: number, vars?: Record<string, string | number>): string {
      return plural(locale, key, count, vars)
    }

    return { t, tp, fmt: formattersFor(locale), locale }
  }, [])
}
