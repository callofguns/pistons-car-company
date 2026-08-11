/**
 * Centralized number-to-string formatting. Every component that prints a number should go
 * through here so formatting stays consistent - direct port of NumberFormatter.cs.
 */

/** Compacts large magnitudes with a K/M/B suffix and one decimal place, e.g. 4_800_000_000 -> "4.8 B". */
export function compact(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)} B`
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)} M`
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)} K`
  return `${sign}${Math.round(abs)}`
}

/** Space-grouped whole number with no suffix, e.g. 97257 -> "97 257". */
export function grouped(value: number): string {
  return Math.round(value).toLocaleString('en-US').replace(/,/g, ' ')
}

/** Dollar-prefixed retail price, ungrouped to match the reference ("$27902"). */
export function plainCurrency(value: number): string {
  return `$${Math.round(value)}`
}

/** Dollar-prefixed retail price with cents, for IAP-style price tags ("$7.49"). */
export function plainCurrencyCents(value: number): string {
  return `$${value.toFixed(2)}`
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

function trim(value: number): string {
  return value.toFixed(1)
}
