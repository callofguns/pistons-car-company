import { describe, expect, it } from 'vitest'
import { formattersFor } from '../src/i18n/format'
import { makeDate } from '../src/core/gameDate'

// ICU canary - must run first. A Node build with small-icu (common on slim CI images) silently
// falls back to en-US formatting for every locale, which would fail every case below with a
// confusing diff instead of pointing at the actual cause. If this fails, the Node/CI image needs
// full-icu, not a code change here.
describe('ICU canary', () => {
  it('this Node build has full ICU data (fr decimal separator is a comma)', () => {
    expect(new Intl.NumberFormat('fr').format(1.5)).toBe('1,5')
  })
})

describe('fmt.compact', () => {
  it('matches core compact() output in en', () => {
    expect(formattersFor('en').compact(1500)).toBe('1.5 K')
  })

  it('uses a comma decimal separator and lowercase k in fr', () => {
    expect(formattersFor('fr').compact(1500)).toBe('1,5 k')
  })

  it('uses a comma decimal separator in es', () => {
    expect(formattersFor('es').compact(1500)).toBe('1,5 K')
  })

  it('does not suffix a sub-thousand value in any locale', () => {
    expect(formattersFor('fr').compact(500)).toBe('500')
  })

  it('preserves the sign for a negative value', () => {
    expect(formattersFor('en').compact(-2_000_000_000)).toBe('-2.0 B')
  })
})

describe('fmt.percent', () => {
  it('matches en output with a decimal point', () => {
    expect(formattersFor('en').percent(15.5)).toBe('15.5%')
  })

  it('uses a comma and a real NBSP before the % sign in fr', () => {
    expect(formattersFor('fr').percent(15.5)).toBe('15,5 %')
  })
})

describe('fmt.date', () => {
  it('matches core formatDate() byte-for-byte in en', () => {
    expect(formattersFor('en').date(makeDate(1970, 1, 8))).toBe('8 Jan. 1970')
  })

  it('localizes the month abbreviation in fr', () => {
    expect(formattersFor('fr').date(makeDate(1970, 1, 8))).toBe('8 janv. 1970')
  })

  it('localizes the month abbreviation in es', () => {
    expect(formattersFor('es').date(makeDate(1970, 1, 8))).toBe('8 ene. 1970')
  })
})
