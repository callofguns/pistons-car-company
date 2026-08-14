import type { LocaleCatalog } from '../keys'

/** Spanish. Typed against LocaleCatalog (en.ts's key set), so a missing or extra key here is a
 * compile error - see en.ts's doc comment for the full convention this file follows. */
export const es: LocaleCatalog = {
  'common.back': 'Atrás',
  'common.skipTutorial': 'Omitir tutorial',

  'nav.saves': 'Partidas',
  'nav.news': 'Noticias',
  'nav.language': 'Idioma',

  'language.screenTitle': 'Idioma',
  'language.pseudoOption': 'Pseudo (dev)',

  // Spanish 1 vs. other than 1 - same two-category shape as English, so these read like a direct
  // translation, but each locale's plural() call still goes through Intl.PluralRules rather than
  // a hand-rolled count===1 check (French needs a third category at large magnitudes).
  'stats.marketingDaysRemaining_one': '{count} día',
  'stats.marketingDaysRemaining_other': '{count} días',
  'stats.unitsSoldToday_one': '{count} unidad hoy',
  'stats.unitsSoldToday_other': '{count} unidades hoy',

  'format.datePattern': '{day} {month} {year}',
  'format.percentPattern': '{value}%',
  'format.magnitude.K': 'K',
  'format.magnitude.M': 'M',
  'format.magnitude.B': 'MM',

  'month.1.abbr': 'ene.',
  'month.2.abbr': 'feb.',
  'month.3.abbr': 'mar.',
  'month.4.abbr': 'abr.',
  'month.5.abbr': 'may.',
  'month.6.abbr': 'jun.',
  'month.7.abbr': 'jul.',
  'month.8.abbr': 'ago.',
  'month.9.abbr': 'sep.',
  'month.10.abbr': 'oct.',
  'month.11.abbr': 'nov.',
  'month.12.abbr': 'dic.',
}
