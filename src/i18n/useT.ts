import { useMemo } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { translate, plural, type VarsFor } from './t'
import { formattersFor } from './format'
import { pseudoize } from './pseudo'
import type { MessageKey, PluralKey } from './keys'

/**
 * The one hook components use for all locale-aware rendering: `t()` for strings, `tp()` for
 * pluralized strings, `fmt` for numbers/dates. A real Zustand subscription on `locale` (a
 * primitive in useSettingsStore, a store separate from useGameStore) - orthogonal to the existing
 * `useGameStore((s) => s.revision)` re-render pattern components already use, not a replacement
 * for it. A component with both re-renders when either changes; there's nothing to reconcile.
 *
 * Deliberately not React Context: Zustand is already this app's global-state mechanism, and a
 * Context provider would be strictly coarser-grained (every consumer re-renders on any change)
 * than this per-primitive subscription.
 *
 * When the dev-only pseudo-locale is active (see ./pseudo.ts), every resolved string is always
 * generated from the English catalog specifically (not whichever real locale es/fr quality
 * happens to be) and then wrapped - pseudo is a migration/overflow detector, not a preview of a
 * particular translation's quality.
 */
export function useT() {
  const locale = useSettingsStore((s) => s.locale)
  const pseudoEnabled = useSettingsStore((s) => s.pseudoEnabled)

  return useMemo(() => {
    const effectiveLocale = pseudoEnabled ? 'en' : locale

    function t<K extends MessageKey>(key: K, ...args: VarsFor<K>): string {
      const resolved = translate(effectiveLocale, key, ...args)
      return pseudoEnabled ? pseudoize(resolved) : resolved
    }

    function tp<K extends PluralKey>(key: K, count: number, vars?: Record<string, string | number>): string {
      const resolved = plural(effectiveLocale, key, count, vars)
      return pseudoEnabled ? pseudoize(resolved) : resolved
    }

    return { t, tp, fmt: formattersFor(effectiveLocale), locale, pseudoEnabled }
  }, [locale, pseudoEnabled])
}
