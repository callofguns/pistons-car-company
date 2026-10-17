/**
 * Centralized number-to-string formatting. Every component that prints a number should go
 * through here so formatting stays consistent - direct port of NumberFormatter.cs.
 *
 * Money always carries a "$": plainCurrency() for exact amounts ("$27,902" - car prices, part
 * costs, loan figures) and src/i18n/format.ts's fmt.money() for large compacted ones ("$250.0 K" -
 * company cash, research, wages). splitMagnitude() below is the one source of truth for the
 * K/M/B thresholds so compact() and fmt.money()/fmt.compact() can't drift.
 */

/** Compacts large magnitudes with a K/M/B suffix and one decimal place, e.g. 4_800_000_000 -> "4.8 B". */
export function compact(value: number): string {
  const { sign, mantissa, magnitude } = splitMagnitude(value)
  if (magnitude === 'unit') return `${sign}${Math.round(mantissa)}`
  return `${sign}${mantissa.toFixed(1)} ${magnitude}`
}

export type Magnitude = 'unit' | 'K' | 'M' | 'B'

/** Splits a value into sign/mantissa/magnitude with no formatting opinions attached - the shared
 * piece both compact() (English, fixed " K"/" M"/" B" suffixes) and src/i18n/format.ts's
 * locale-aware fmt.compact() (translated suffixes, locale decimal separator) build on, so the
 * thresholds themselves live in exactly one place. */
export function splitMagnitude(value: number): { sign: string; mantissa: number; magnitude: Magnitude } {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs >= 1_000_000_000) return { sign, mantissa: abs / 1_000_000_000, magnitude: 'B' }
  if (abs >= 1_000_000) return { sign, mantissa: abs / 1_000_000, magnitude: 'M' }
  if (abs >= 1_000) return { sign, mantissa: abs / 1_000, magnitude: 'K' }
  return { sign, mantissa: abs, magnitude: 'unit' }
}

/** Comma-grouped whole number with no suffix, e.g. 97257 -> "97,257". Regex-based rather than
 * Intl/toLocaleString so the output never varies between browsers. */
export function grouped(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Exact dollar amount, comma-grouped, sign before the "$": 27902 -> "$27,902", -500 -> "-$500". */
export function plainCurrency(value: number): string {
  const rounded = Math.round(value)
  return `${rounded < 0 ? '-' : ''}$${grouped(Math.abs(rounded))}`
}

/** Whole-number-ish percent with a trailing '%', e.g. 15.5 -> "15.5%". */
export function percent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** Signed percent delta badge text, e.g. 2 -> "+2%", -5 -> "-5%". */
export function signedPercent(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${Math.round(delta)}%`
}
