import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/locales/en'
import { es } from '../src/i18n/locales/es'
import { fr } from '../src/i18n/locales/fr'
import { translate, plural } from '../src/i18n/t'
import type { MessageKey } from '../src/i18n/keys'

const LOCALES = { en, es, fr } as const

function tokensIn(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

describe('i18n catalogs', () => {
  it('every locale has exactly the same key set as en', () => {
    const enKeys = Object.keys(en).sort()
    expect(Object.keys(es).sort()).toEqual(enKeys)
    expect(Object.keys(fr).sort()).toEqual(enKeys)
  })

  it('no catalog value is empty', () => {
    for (const [name, catalog] of Object.entries(LOCALES)) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value.trim().length, `${name}.${key} is empty`).toBeGreaterThan(0)
      }
    }
  })

  // The highest-value test in this file: a translator dropping a {token} produces a sentence
  // silently missing its noun/number rather than a build failure, so this is the only thing that
  // actually catches it.
  it('every locale uses exactly the same {tokens} as en, per key', () => {
    for (const key of Object.keys(en) as MessageKey[]) {
      const expected = tokensIn(en[key])
      expect(tokensIn(es[key]), `es.${key}`).toEqual(expected)
      expect(tokensIn(fr[key]), `fr.${key}`).toEqual(expected)
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

  // The whole reason plural() goes through Intl.PluralRules instead of a hand-rolled
  // count===1 check: French's CLDR "one" category covers BOTH 0 and 1, not just 1.
  it('treats 0 as singular in French, unlike English/Spanish', () => {
    expect(plural('fr', 'stats.marketingDaysRemaining', 0)).toBe('0 jour')
    expect(plural('fr', 'stats.marketingDaysRemaining', 1)).toBe('1 jour')
    expect(plural('fr', 'stats.marketingDaysRemaining', 2)).toBe('2 jours')
    expect(plural('es', 'stats.marketingDaysRemaining', 0)).toBe('0 días')
  })
})
