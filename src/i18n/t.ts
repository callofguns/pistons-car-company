import type { Locale } from './locale'
import type { MessageKey, PluralKey } from './keys'
import { en } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'

/** All three catalogs bundled eagerly (~10 KB gzipped total - noise next to the app's 5 self-
 * hosted font files, see tokens.css). Lazy-loading would make setLocale async and force an
 * English flash on cold start for a non-EN player in an app that already precaches everything
 * offline anyway - not worth it for this catalog size. Revisit only if a much larger locale
 * (e.g. a CJK one, which would also need a font change) lands. */
const CATALOGS: Record<Locale, Record<MessageKey, string>> = { en, es, fr }

function catalogOf(locale: Locale): Record<MessageKey, string> {
  return CATALOGS[locale]
}

const TOKEN = /\{(\w+)\}/g

/** Substitutes `{token}` placeholders. An unknown token is left verbatim rather than blanked - a
 * visible `{model}` in QA is a bug report; a silently blank sentence is invisible. */
function interpolate(message: string, vars?: Record<string, string | number>): string {
  if (!vars) return message
  return message.replace(TOKEN, (whole, name: string) => (name in vars ? String(vars[name]) : whole))
}

/** Extracts the `{token}` names a message string requires, at the type level, so a translate()
 * call missing a required variable fails to compile. Resolves lazily per call site (based on the
 * literal type of en[key]), so this doesn't cost hundreds of eager evaluations. If this ever shows
 * up in `tsc --noEmit` timing, the one-line escape hatch is replacing VarsFor's result with
 * `vars?: Record<string, string | number>` - zero call-site churn either way. */
type VarNames<S extends string> = S extends `${string}{${infer V}}${infer Rest}` ? V | VarNames<Rest> : never
export type VarsFor<K extends MessageKey> = [VarNames<(typeof en)[K]>] extends [never]
  ? [vars?: Record<string, string | number>]
  : [vars: Record<VarNames<(typeof en)[K]>, string | number>]

/** Resolves a message key in the given locale and interpolates any `{token}`s. Falls back to
 * English, then to the bare key, so a stray `as MessageKey` cast can't produce a blank UI - that
 * fallback path should be unreachable in practice (es.ts/fr.ts are compile-checked against the
 * full key set) and warns in dev if it's ever hit.
 *
 * Two overloads: a literal key (`t('nav.saves')`) gets VarsFor<K>'s full compile-time check -
 * missing or extra {token} vars are a build error. A key that's only known as the general
 * MessageKey union at the call site - built dynamically, e.g. `` `month.${d.month}.abbr` as
 * MessageKey `` below, or the researchNodes.ts/designSteps.ts id-derived keys a later PR adds -
 * can't get that same static check (TS has no way to narrow which specific literal it is), so it
 * falls through to plain optional vars instead. That gap is deliberate, not a workaround for a
 * bug: it trades static checking for a runtime one on exactly the keys where static checking was
 * never possible in the first place - see PR 3's note about covering those with a vitest walk
 * instead. */
export function translate<K extends MessageKey>(locale: Locale, key: K, ...args: VarsFor<K>): string
export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string
export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const message = catalogOf(locale)[key] ?? en[key] ?? key
  if (message === key && import.meta.env.DEV) {
    console.warn(`[i18n] Missing message for key "${key}" in every locale - this should be unreachable.`)
  }
  return interpolate(message, vars)
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>()

function pluralRulesFor(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale)
    pluralRulesCache.set(locale, rules)
  }
  return rules
}

/** Resolves a `_one`/`_other`-suffixed key pair by count, via Intl.PluralRules rather than a
 * hand-rolled `count === 1` check - CLDR gives French a `many` category at large magnitudes that a
 * hand-rolled EN/ES-shaped check would get silently wrong, and would keep getting wrong for any
 * future locale. `count` is auto-injected into vars as `{count}`. Falls back through the CLDR
 * categories this app's catalogs don't author (`few`, `many`) to `_other`, which every locale must
 * supply. */
export function plural<K extends PluralKey>(
  locale: Locale,
  key: K,
  count: number,
  vars?: Record<string, string | number>,
): string {
  const category = pluralRulesFor(locale).select(count)
  const catalog = catalogOf(locale)
  const exactKey = `${key}_${category}` as MessageKey
  const fallbackKey = `${key}_other` as MessageKey
  const message = catalog[exactKey] ?? catalog[fallbackKey] ?? en[fallbackKey] ?? fallbackKey
  return interpolate(message, { count, ...vars })
}
