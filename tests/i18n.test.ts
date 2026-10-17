import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/locales/en'
import { translate, plural } from '../src/i18n/t'
import type { MessageKey } from '../src/i18n/keys'

describe('i18n catalog', () => {
  it('no catalog value is empty', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim().length, `en.${key} is empty`).toBeGreaterThan(0)
    }
  })
})

describe('translate', () => {
  it('substitutes a known token', () => {
    expect(translate('en', 'format.datePattern', { day: 8, month: 'Jan.', year: 1970 })).toBe('8 Jan. 1970')
  })

  it('leaves a token missing from vars verbatim rather than blanking it', () => {
    // Deliberately typed around VarsFor's compile-time check (which would normally require every
    // {token} in the message) to exercise the runtime fallback directly - a visible "{year}" in
    // QA is a bug report; a silently blank sentence is invisible.
    const vars = { day: 8, month: 'Jan.' } as Record<string, string | number>
    expect(translate('en', 'format.datePattern', vars)).toBe('8 Jan. {year}')
  })

  it('falls back to the bare key for a key absent from every catalog (unreachable via normal typed call sites)', () => {
    expect(translate('en', 'nope.not.a.real.key' as MessageKey)).toBe('nope.not.a.real.key')
  })
})

describe('plural', () => {
  it('picks the singular English form at count 1 and plural otherwise', () => {
    expect(plural('en', 'stats.marketingDaysRemaining', 1)).toBe('1 Day')
    expect(plural('en', 'stats.marketingDaysRemaining', 0)).toBe('0 Days')
    expect(plural('en', 'stats.unitsSoldToday', 1)).toBe('1 unit today')
    expect(plural('en', 'stats.unitsSoldToday', 5)).toBe('5 units today')
  })

})
