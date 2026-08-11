export interface LoanTierDefinition {
  id: string
  displayName: string
  principal: number
  annualInterestRate: number
  termMonths: number
}

/** The three loan products on the Finance screen - replaces the old "free investor cash advance" placeholder with real debt: a principal now, a fixed monthly payment (interest + principal, amortized) for the whole term. */
export const LOAN_TIERS: LoanTierDefinition[] = [
  { id: 'small', displayName: 'Small', principal: 50_000, annualInterestRate: 0.08, termMonths: 12 },
  { id: 'medium', displayName: 'Medium', principal: 150_000, annualInterestRate: 0.1, termMonths: 18 },
  { id: 'large', displayName: 'Large', principal: 400_000, annualInterestRate: 0.12, termMonths: 24 },
]
