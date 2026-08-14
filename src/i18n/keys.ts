import { en } from './locales/en'

/** The exact set of valid message keys, derived from the English catalog. A call site passing a
 * key that doesn't exist (typo, or a key that only exists in es.ts/fr.ts by mistake) fails to
 * compile - there is no runtime "key not found" path for this case. */
export type MessageKey = keyof typeof en

/** Every non-English locale must supply exactly this key set - both a missing key and a stray
 * extra/misspelled key are compile errors on the locale file itself. */
export type LocaleCatalog = Record<MessageKey, string>

/** Keys ending `_other` are the plural family's required member; `plural()` in ./t.ts derives the
 * base name (e.g. `stats.marketingDays` from `stats.marketingDays_other`) so a plural call site is
 * checked against the keys that actually exist, without hand-maintaining a separate list. */
export type PluralKey<K extends string = MessageKey> = K extends `${infer Base}_other` ? Base : never
