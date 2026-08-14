/**
 * The source-of-truth catalog. Every other locale file is typed against this one's key set
 * (`LocaleCatalog = Record<MessageKey, string>` in ../keys.ts), so adding a key here without
 * adding it to es.ts/fr.ts is a compile error, and so is a typo'd key at any call site.
 *
 * Flat, dotted string keys rather than a nested object - `keyof typeof en` gives an exact
 * string-literal union for free (a nested Paths<T> conditional type is slow to check and produces
 * unreadable errors), and it's what lets `Record<MessageKey, string>` catch missing/extra keys on
 * the other locales without a hand-written deep-required type.
 *
 * Key convention: `<domain>.<subject>.<role>`. Keys are semantic paths, not English strings - e.g.
 * `data.loanTier.medium.name` / `data.promoTier.medium.name` / `data.classification.medium.label`
 * are three different keys even though they're all "Medium" in English, because ES/FR need three
 * different words there (including gender agreement). Never key on the English source string.
 *
 * `{token}` interpolation reuses the convention already in src/data/rumorTemplates.ts. Plural
 * keys come in `_one`/`_other` sibling pairs (see plural() in ../t.ts) rather than a single key
 * with baked-in English pluralization logic.
 */
export const en = {
  // common - reused across many screens
  'common.back': 'Back',
  'common.skipTutorial': 'Skip tutorial',

  // nav - Main Menu + Office Hub entry points
  'nav.saves': 'Saves',
  'nav.news': 'News',
  'nav.language': 'Language',

  // language screen
  'language.screenTitle': 'Language',
  'language.pseudoOption': 'Pseudo (dev)',

  // stats.* - pluralized, _one/_other sibling pairs (see plural() in ./t.ts). Seeded here ahead of
  // their PR 2 call sites (SalesStatisticsScreen) since they fix two live pluralization bugs
  // ("1 Days", "1 units today") that the migration is specifically meant to catch.
  'stats.marketingDaysRemaining_one': '{count} Day',
  'stats.marketingDaysRemaining_other': '{count} Days',
  'stats.unitsSoldToday_one': '{count} unit today',
  'stats.unitsSoldToday_other': '{count} units today',

  // format - consumed by src/i18n/format.ts, never rendered as a whole message on their own
  'format.datePattern': '{day} {month} {year}',
  'format.percentPattern': '{value}%',
  'format.magnitude.K': 'K',
  'format.magnitude.M': 'M',
  'format.magnitude.B': 'B',

  'month.1.abbr': 'Jan.',
  'month.2.abbr': 'Feb.',
  'month.3.abbr': 'Mar.',
  'month.4.abbr': 'Apr.',
  'month.5.abbr': 'May',
  'month.6.abbr': 'Jun.',
  'month.7.abbr': 'Jul.',
  'month.8.abbr': 'Aug.',
  'month.9.abbr': 'Sep.',
  'month.10.abbr': 'Oct.',
  'month.11.abbr': 'Nov.',
  'month.12.abbr': 'Dec.',
} as const satisfies Record<string, string>
