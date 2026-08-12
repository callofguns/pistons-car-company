import { useGameStore } from '../store/useGameStore'
import { Button, Heading } from './Primitives'

/** Full-screen soft-fail state, rendered by App.tsx in place of the normal screen router once
 * world.company.isBankrupt is true. Restarts fresh in the same save slot under the same company
 * name rather than routing back through Main Menu's naming/slot-picker flow. */
export function BankruptcyOverlay() {
  const restartAfterBankruptcy = useGameStore((s) => s.restartAfterBankruptcy)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        textAlign: 'center',
        padding: 24,
        zIndex: 1000,
      }}
    >
      <span style={{ fontSize: '3rem' }}>💸</span>
      <Heading style={{ fontSize: '2rem', color: 'var(--color-danger)' }}>Company Bankrupt</Heading>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480 }}>
        The balance stayed too deep in debt for too long, and the company has run out of road. Time to start a new
        one.
      </p>
      <Button variant="primary" onClick={restartAfterBankruptcy}>
        + START NEW GAME
      </Button>
    </div>
  )
}
