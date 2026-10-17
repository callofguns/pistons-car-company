import { useGameStore } from '../store/useGameStore'
import { LOAN_TIERS } from '../data/loanTiers'
import { plainCurrency } from '../core/numberFormat'
import { monthNetProfit, monthTotalExpense, monthTotalIncome, type TransactionCategory } from '../core/ledger'
import { computeAmortizedPayment } from '../core/economy'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { StatRow } from '../components/StatRow'
import { Button } from '../components/Primitives'
import styles from './screen.module.css'
import bankStyles from './BankScreen.module.css'

const CATEGORY_LABEL_KEY: Record<TransactionCategory, MessageKey> = {
  Sales: 'data.transactionCategory.Sales',
  Staff: 'data.transactionCategory.Staff',
  HQOverhead: 'data.transactionCategory.HQOverhead',
  HQUpgrade: 'data.transactionCategory.HQUpgrade',
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
      <div className={bankStyles.balance}>
        <span className={styles.sectionTitle}>{t('bank.cashBalance')}</span>
        <span className={`${bankStyles.balanceValue} ${bank.balance < 0 ? bankStyles.negative : ''}`}>{plainCurrency(bank.balance)}</span>
        {bank.balance < 0 && <span style={{ color: 'var(--color-danger)' }}>{t('bank.overdraftWarning')}</span>}
      </div>

      <div className={bankStyles.columns}>
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>{t('bank.thisMonth')}</h3>
          <StatRow label={t('bank.income')} value={fmt.money(income)} />
          {incomeCategories.map(([category, amount]) => (
            <StatRow key={category} label={`  ${t(CATEGORY_LABEL_KEY[category])}`} value={fmt.money(amount)} />
          ))}
          <StatRow label={t('bank.expenses')} value={fmt.money(expense)} />
          {expenseCategories.map(([category, amount]) => (
            <StatRow key={category} label={`  ${t(CATEGORY_LABEL_KEY[category])}`} value={fmt.money(amount)} />
          ))}
          <div className={bankStyles.netRow}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('bank.netProfit')}</span>
            <span style={{ fontWeight: 600, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-danger)' }}>
              {netProfit >= 0 ? '+' : ''}
              {fmt.money(netProfit)}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          {bank.loans.length > 0 && (
            <>
              <h3 className={styles.sectionTitle}>{t('bank.activeLoans')}</h3>
              {bank.loans.map((loan) => (
                <StatRow
                  key={loan.id}
                  label={t('bank.loanLabel', { principal: plainCurrency(loan.principal), rate: fmt.percent(loan.annualInterestRate * 100, 0) })}
                  value={t('bank.loanValue', { remaining: plainCurrency(loan.remainingBalance), payment: plainCurrency(loan.monthlyPayment) })}
                />
              ))}
            </>
          )}

          <h3 className={styles.sectionTitle}>{t('bank.takeALoan')}</h3>
          <div className={bankStyles.loans}>
            {LOAN_TIERS.map((tier) => {
              const payment = computeAmortizedPayment(tier.principal, tier.annualInterestRate, tier.termMonths)
              return (
                <div key={tier.id} className={bankStyles.loanCard}>
                  <span className={styles.sectionTitle}>{t(tier.displayNameKey)}</span>
                  <span className={bankStyles.loanAmount}>{plainCurrency(tier.principal)}</span>
                  <span className={bankStyles.loanDetail}>
                    {t('bank.rateAndTerm', { rate: fmt.percent(tier.annualInterestRate * 100, 0), months: tier.termMonths })}
                  </span>
                  <span className={bankStyles.loanDetail}>{t('bank.perMonth', { amount: plainCurrency(payment) })}</span>
                  <Button variant="gold" onClick={() => takeLoan(tier.id)}>
                    {t('bank.takeLoan')}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
