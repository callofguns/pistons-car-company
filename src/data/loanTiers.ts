import type { MessageKey } from '../i18n/keys'

export interface LoanTierDefinition {
  id: string
  /** English source string, kept as a non-translated fallback only - display sites should use
   * displayNameKey via t() instead. 'Medium' here is a DIFFERENT key/word than
   * data.promoTier.medium.name or data.classification.medium.label despite the shared English
   * word - see en.ts's module doc. */
  displayName: string
  displayNameKey: MessageKey
  principal: number
  annualInterestRate: number
  termMonths: number
}

/** The three loan products on the Finance screen - replaces the old "free investor cash advance" placeholder with real debt: a principal now, a fixed monthly payment (interest + principal, amortized) for the whole term. */
export const LOAN_TIERS: LoanTierDefinition[] = [
  { id: 'small', displayName: 'Small', displayNameKey: 'data.loanTier.small.name', principal: 50_000, annualInterestRate: 0.08, termMonths: 12 },
  { id: 'medium', displayName: 'Medium', displayNameKey: 'data.loanTier.medium.name', principal: 150_000, annualInterestRate: 0.1, termMonths: 18 },
  { id: 'large', displayName: 'Large', displayNameKey: 'data.loanTier.large.name', principal: 400_000, annualInterestRate: 0.12, termMonths: 24 },
]
