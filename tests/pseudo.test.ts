import { describe, expect, it } from 'vitest'
import { pseudoize } from '../src/i18n/pseudo'

describe('pseudoize', () => {
  it('wraps the message in brackets', () => {
    expect(pseudoize('Hello')).toMatch(/^⟦.*⟧$/)
  })

  it('accentifies vowels so an un-migrated plain-ASCII string stands out by comparison', () => {
    expect(pseudoize('Save')).toContain('á')
    expect(pseudoize('Save')).not.toContain('a')
  })

  it('pads the output to roughly 140% of the original length, catching containers that cannot absorb translated text running long', () => {
    const original = 'Continue'
    const result = pseudoize(original)
    // Padding is proportional to input length (~40% extra), plus the fixed bracket/space
    // overhead - just assert it grew meaningfully rather than pinning an exact character count.
    expect(result.length).toBeGreaterThan(original.length * 1.3)
  })

  it('is deterministic for the same input', () => {
    expect(pseudoize('Model name')).toBe(pseudoize('Model name'))
  })
})
