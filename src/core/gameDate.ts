/**
 * A calendar day in the simulation. Plain data + pure functions rather than a class - arithmetic
 * goes through UTC epoch-millisecond math (Date.UTC) specifically so it never touches the
 * browser's local timezone/DST, which is what makes addDays/leap-years correct for free, same
 * guarantee the C# port got from wrapping DateTime.
 */
export interface GameDate {
  year: number
  month: number
  day: number
}

const MONTH_ABBREVIATIONS = [
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.',
  'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.',
] as const

export function makeDate(year: number, month: number, day: number): GameDate {
  return { year, month, day }
}

function toEpochMs(d: GameDate): number {
  return Date.UTC(d.year, d.month - 1, d.day)
}

function fromEpochMs(ms: number): GameDate {
  const dt = new Date(ms)
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() }
}

const MS_PER_DAY = 86_400_000

export function addDays(d: GameDate, days: number): GameDate {
  return fromEpochMs(toEpochMs(d) + days * MS_PER_DAY)
}

export function daysBetween(from: GameDate, to: GameDate): number {
  return Math.round((toEpochMs(to) - toEpochMs(from)) / MS_PER_DAY)
}

export function compareDates(a: GameDate, b: GameDate): number {
  return toEpochMs(a) - toEpochMs(b)
}

export function isSameMonth(a: GameDate, b: GameDate): boolean {
  return a.year === b.year && a.month === b.month
}

export function monthAbbreviation(d: GameDate): string {
  return MONTH_ABBREVIATIONS[d.month - 1]
}

export function formatDate(d: GameDate): string {
  return `${d.day} ${monthAbbreviation(d)} ${d.year}`
}
