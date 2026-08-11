import { useGameStore } from '../store/useGameStore'
import { plainCurrency } from '../core/numberFormat'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

const LOAN_AMOUNTS = [500_000, 2_000_000, 10_000_000]

/**
 * The reference's "GAME BANK" screen sells real-money IAP bundles - not appropriate to reproduce
 * verbatim here. Reinterpreted as an in-fiction investor cash advance: three fixed amounts,
 * granted immediately, no repayment simulation modeled yet (same simplification as the Unity port).
 */
export function BankScreen() {
  const claimAdBonus = useGameStore((s) => s.claimAdBonus)

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`}>
      <Heading>Investor Cash Advance</Heading>
      {LOAN_AMOUNTS.map((amount) => (
        <Button key={amount} variant="gold" style={{ width: '100%' }} onClick={() => claimAdBonus(amount)}>
          {plainCurrency(amount)}
        </Button>
      ))}
    </div>
  )
}
