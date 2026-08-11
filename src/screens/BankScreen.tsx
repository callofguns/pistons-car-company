import { useGameStore } from '../store/useGameStore'
import { LOAN_TIERS } from '../data/loanTiers'
import { compact, percent, plainCurrency } from '../core/numberFormat'
import { monthNetProfit, monthTotalExpense, monthTotalIncome, type TransactionCategory } from '../core/ledger'
import { computeAmortizedPayment } from '../core/economy'
import { StatRow } from '../components/StatRow'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import bankStyles from './BankScreen.module.css'

const CATEGORY_LABEL: Record<TransactionCategory, string> = {
  Sales: 'Sales',
  Staff: 'Staff wages',
  HQOverhead: 'HQ overhead',
  Production: 'Production',
  Research: 'Research',
  Marketing: 'Marketing',
  Racing: 'Racing',
  LoanPrincipal: 'Loan principal',
  LoanInterest: 'Loan interest',
  OverdraftInterest: 'Overdraft interest',
  Other: 'Other',
}

/** The Finance screen: current balance, active loans, a month-to-date P&L breakdown, and the three real loan products (principal now, amortized monthly payments, real interest - no more free cash). */
export function BankScreen() {
  useGameStore((s) => s.revision)
  const bank = useGameStore((s) => s.world.bank)
  const ledger = useGameStore((s) => s.world.ledger)
  const takeLoan = useGameStore((s) => s.takeLoan)

  const income = monthTotalIncome(ledger)
  const expense = monthTotalExpense(ledger)
  const netProfit = monthNetProfit(ledger)

  const expenseCategories = Object.entries(ledger.monthExpenseByCategory) as [TransactionCategory, number][]
  const incomeCategories = Object.entries(ledger.monthIncomeByCategory) as [TransactionCategory, number][]

  return (
    <div className={styles.screen}>
      <Heading>Finance</Heading>

      <StatRow label="Cash balance" value={plainCurrency(bank.balance)} />
      {bank.balance < 0 && (
        <span style={{ color: 'var(--color-red)' }}>
          Balance is negative - overdraft interest is accruing daily until this recovers.
        </span>
      )}

      {bank.loans.length > 0 && (
        <>
          <Heading style={{ fontSize: '1.1rem' }}>Active Loans</Heading>
          {bank.loans.map((loan) => (
            <StatRow
              key={loan.id}
              label={`${plainCurrency(loan.principal)} @ ${percent(loan.annualInterestRate * 100, 0)}/yr`}
              value={`${plainCurrency(loan.remainingBalance)} left · ${plainCurrency(loan.monthlyPayment)}/mo`}
            />
          ))}
        </>
      )}

      <Heading style={{ fontSize: '1.1rem' }}>This Month</Heading>
      <StatRow label="Income" value={compact(income)} />
      {incomeCategories.map(([category, amount]) => (
        <StatRow key={category} label={`  ${CATEGORY_LABEL[category]}`} value={compact(amount)} />
      ))}
      <StatRow label="Expenses" value={compact(expense)} />
      {expenseCategories.map(([category, amount]) => (
        <StatRow key={category} label={`  ${CATEGORY_LABEL[category]}`} value={compact(amount)} />
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>Net profit</span>
        <span style={{ fontWeight: 700, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
          {netProfit >= 0 ? '+' : ''}
          {compact(netProfit)}
        </span>
      </div>

      <Heading style={{ fontSize: '1.1rem' }}>Take a Loan</Heading>
      <div className={styles.grid}>
        {LOAN_TIERS.map((tier) => {
          const payment = computeAmortizedPayment(tier.principal, tier.annualInterestRate, tier.termMonths)
          return (
            <div key={tier.id} className={bankStyles.loanCard}>
              <strong>{tier.displayName}</strong>
              <span>{plainCurrency(tier.principal)}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                {percent(tier.annualInterestRate * 100, 0)}/yr · {tier.termMonths} months
              </span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{plainCurrency(payment)}/mo</span>
              <Button variant="gold" onClick={() => takeLoan(tier.id)}>
                TAKE LOAN
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
