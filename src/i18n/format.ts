import type { Locale } from './locale'
import { translate } from './t'
import { splitMagnitude } from '../core/numberFormat'
import type { GameDate } from '../core/gameDate'
import type { MessageKey } from './keys'

/**
 * Locale-aware siblings of src/core/numberFormat.ts and src/core/gameDate.ts. Core stays pure and
 * English (see numberFormat.ts's module doc) - this file wraps it rather than replacing it, so
 * none of core's existing tests became locale-dependent when this was added.
 *
 * Deliberately NOT using Intl.NumberFormat({notation:'compact'}) or Intl.DateTimeFormat: their
 * output varies by browser ICU version, which would make the game's fixed-width HUD pills
 * non-deterministic between browsers, and Intl.DateTimeFormat can't produce "Jan." (only "Jan" or
 * "January") so it wouldn't even match the reference. Intl is used only for the two things it's
 * actually authoritative on here: the decimal separator (NumberFormat) and plural category
 * selection (PluralRules, in ./t.ts) - never for magnitudes, currency, or date shape.
 *
 * plainCurrency() from core is intentionally not wrapped at all - "$27902" ungrouped is deliberate
 * retro art direction, not a locale default. Localizing it (e.g. "27 902 $" in fr-FR) would fight
 * the reference look and blow out every fixed-width price field in the UI.
 */

const decimalFormatCache = new Map<Locale, Intl.NumberFormat>()

function decimalFormatFor(locale: Locale): Intl.NumberFormat {
  // Intl.NumberFormat construction is genuinely expensive, and fmt.compact/fmt.percent run in
  // TopHud, which re-renders on every revision bump - i.e. every in-game day.
  let format = decimalFormatCache.get(locale)
  if (!format) {
    format = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    decimalFormatCache.set(locale, format)
  }
  return format
}

// Typed as the exact literal union (not the wide MessageKey) so translate()'s call at each lookup
// site below still gets the strict, no-vars-needed overload rather than falling through to the
// dynamic-key one - these three are statically known, unlike month.N.abbr further down.
const MAGNITUDE_KEY: Record<'K' | 'M' | 'B', 'format.magnitude.K' | 'format.magnitude.M' | 'format.magnitude.B'> = {
  K: 'format.magnitude.K',
  M: 'format.magnitude.M',
  B: 'format.magnitude.B',
}

// U+00A0 (non-breaking space) rather than a literal space in this source file, spelled out via
// escape so it can't silently degrade to a plain space in an editor/diff the way a literal NBSP
// pasted into locales/fr.ts's catalog easily could. The catalog's format.percentPattern therefore
// deliberately uses a plain space (see its comment in locales/fr.ts), and this is where that
// plain space gets normalized to a real NBSP, at format time rather than at author time.
const NBSP = ' '

export interface Formatters {
  /** e.g. "4,8 M" in fr, vs core's compact()'s "4.8 M". Same thresholds (splitMagnitude), locale
   * decimal separator and translated suffix. */
  compact(value: number): string
  /** e.g. "15,5 %" in fr. */
  percent(value: number, decimals?: number): string
  /** "8 Jan. 1970" in en (byte-identical to core's formatDate), "8 janv. 1970" in fr. */
  date(d: GameDate): string
}

const formattersCache = new Map<Locale, Formatters>()

export function formattersFor(locale: Locale): Formatters {
  let formatters = formattersCache.get(locale)
  if (formatters) return formatters

  formatters = {
    compact(value) {
      const { sign, mantissa, magnitude } = splitMagnitude(value)
      if (magnitude === 'unit') return `${sign}${Math.round(mantissa)}`
      return `${sign}${decimalFormatFor(locale).format(mantissa)} ${translate(locale, MAGNITUDE_KEY[magnitude])}`
    },

    percent(value, decimals = 1) {
      const formattedValue = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)
      const rendered = translate(locale, 'format.percentPattern', { value: formattedValue })
      return rendered.replace(' %', `${NBSP}%`)
    },

    date(d) {
      const month = translate(locale, `month.${d.month}.abbr` as MessageKey)
      return translate(locale, 'format.datePattern', { day: d.day, month, year: d.year })
    },
  }

  formattersCache.set(locale, formatters)
  return formatters
}
