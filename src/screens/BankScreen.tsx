import { useGameStore } from '../store/useGameStore'
import { LOAN_TIERS } from '../data/loanTiers'
import { plainCurrency } from '../core/numberFormat'
import { monthNetProfit, monthTotalExpense, monthTotalIncome, type TransactionCategory } from '../core/ledger'
import { computeAmortizedPayment } from '../core/economy'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { StatRow } from '../components/StatRow'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import bankStyles from './BankScreen.module.css'

const CATEGORY_LABEL_KEY: Record<TransactionCategory, MessageKey> = {
  Sales: 'data.transactionCategory.Sales',
  Staff: 'data.transactionCategory.Staff',
  HQOverhead: 'data.transactionCategory.HQOverhead',
  Production: 'data.transactionCategory.Production',
  Research: 'data.transactionCategory.Research',
  Marketing: 'data.transactionCategory.Marketing',
  Racing: 'data.transactionCategory.Racing',
  LoanPrincipal: 'data.transactionCategory.LoanPrincipal',
  LoanInterest: 'data.transactionCategory.LoanInterest',
  OverdraftInterest: 'data.transactionCategory.OverdraftInterest',
  Other: 'data.transactionCategory.Other',
}

/** The Finance screen: current balance, active loans, a month-to-date P&L breakdown, and the three real loan products (principal now, amortized monthly payments, real interest - no more free cash). */
export function BankScreen() {
  useGameStore((s) => s.revision)
  const bank = useGameStore((s) => s.world.bank)
  const ledger = useGameStore((s) => s.world.ledger)
  const takeLoan = useGameStore((s) => s.takeLoan)
  const { t, fmt } = useT()

  const income = monthTotalIncome(ledger)
  const expense = monthTotalExpense(ledger)
  const netProfit = monthNetProfit(ledger)

  const expenseCategories = Object.entries(ledger.monthExpenseByCategory) as [TransactionCategory, number][]
  const incomeCategories = Object.entries(ledger.monthIncomeByCategory) as [TransactionCategory, number][]

  return (
    <div className={styles.screen}>
      <Heading>{t('screen.bank.title')}</Heading>

      <StatRow label={t('bank.cashBalance')} value={plainCurrency(bank.balance)} />
      {bank.balance < 0 && <span style={{ color: 'var(--color-danger)' }}>{t('bank.overdraftWarning')}</span>}

      {bank.loans.length > 0 && (
        <>
          <Heading style={{ fontSize: '1.1rem' }}>{t('bank.activeLoans')}</Heading>
          {bank.loans.map((loan) => (
            <StatRow
              key={loan.id}
              label={t('bank.loanLabel', { principal: plainCurrency(loan.principal), rate: fmt.percent(loan.annualInterestRate * 100, 0) })}
              value={t('bank.loanValue', { remaining: plainCurrency(loan.remainingBalance), payment: plainCurrency(loan.monthlyPayment) })}
            />
          ))}
        </>
      )}

      <Heading style={{ fontSize: '1.1rem' }}>{t('bank.thisMonth')}</Heading>
      <StatRow label={t('bank.income')} value={fmt.compact(income)} />
      {incomeCategories.map(([category, amount]) => (
        <StatRow key={category} label={`  ${t(CATEGORY_LABEL_KEY[category])}`} value={fmt.compact(amount)} />
      ))}
      <StatRow label={t('bank.expenses')} value={fmt.compact(expense)} />
      {expenseCategories.map(([category, amount]) => (
        <StatRow key={category} label={`  ${t(CATEGORY_LABEL_KEY[category])}`} value={fmt.compact(amount)} />
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{t('bank.netProfit')}</span>
        <span style={{ fontWeight: 700, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-danger)' }}>
          {netProfit >= 0 ? '+' : ''}
          {fmt.compact(netProfit)}
        </span>
      </div>

      <Heading style={{ fontSize: '1.1rem' }}>{t('bank.takeALoan')}</Heading>
      <div className={styles.grid}>
        {LOAN_TIERS.map((tier) => {
          const payment = computeAmortizedPayment(tier.principal, tier.annualInterestRate, tier.termMonths)
          return (
            <div key={tier.id} className={bankStyles.loanCard}>
              <strong>{tier.displayName}</strong>
              <span>{plainCurrency(tier.principal)}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                {t('bank.rateAndTerm', { rate: fmt.percent(tier.annualInterestRate * 100, 0), months: tier.termMonths })}
              </span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                {t('bank.perMonth', { amount: plainCurrency(payment) })}
              </span>
              <Button variant="gold" onClick={() => takeLoan(tier.id)}>
                {t('bank.takeLoan')}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
