import type { LocaleCatalog } from '../keys'

/** French. Typed against LocaleCatalog (en.ts's key set), so a missing or extra key here is a
 * compile error - see en.ts's doc comment for the full convention this file follows. */
export const fr: LocaleCatalog = {
  'common.back': 'Retour',
  'common.skipTutorial': 'Passer le tutoriel',

  'nav.saves': 'Parties',
  'nav.news': 'Actualités',
  'nav.language': 'Langue',

  'language.screenTitle': 'Langue',
  'language.pseudoOption': 'Pseudo (dev)',

  // French's plural rule is genuinely different, not just a translated copy of the EN/ES shape:
  // CLDR puts BOTH 0 and 1 in the "one" category here (only 2+ is "other"), which is exactly the
  // kind of thing plural()'s use of Intl.PluralRules (rather than a hand-rolled count===1 check)
  // exists to get right automatically - see tests/i18n.test.ts's French-specific plural case.
  'stats.marketingDaysRemaining_one': '{count} jour',
  'stats.marketingDaysRemaining_other': '{count} jours',
  'stats.unitsSoldToday_one': '{count} unité aujourd’hui',
  'stats.unitsSoldToday_other': '{count} unités aujourd’hui',

  // FR convention wants a non-breaking space before '%' - a plain space is intentional here
  // (an actual NBSP is easy to lose in an editor/diff); src/i18n/format.ts's fmt.percent()
  // normalizes the rendered space to U+00A0 at format time instead of relying on this literal.
  'format.datePattern': '{day} {month} {year}',
  'format.percentPattern': '{value} %',
  'format.magnitude.K': 'k',
  'format.magnitude.M': 'M',
  'format.magnitude.B': 'Md',

  'month.1.abbr': 'janv.',
  'month.2.abbr': 'févr.',
  'month.3.abbr': 'mars',
  'month.4.abbr': 'avr.',
  'month.5.abbr': 'mai',
  'month.6.abbr': 'juin',
  'month.7.abbr': 'juil.',
  'month.8.abbr': 'août',
  'month.9.abbr': 'sept.',
  'month.10.abbr': 'oct.',
  'month.11.abbr': 'nov.',
  'month.12.abbr': 'déc.',
}
