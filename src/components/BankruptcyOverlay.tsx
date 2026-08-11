import { useGameStore } from '../store/useGameStore'
import { Button, Heading } from './Primitives'

/** Full-screen soft-fail state, rendered by App.tsx in place of the normal screen router once world.company.isBankrupt is true. Reuses the same startNewGame() action as Main Menu's "+ NEW GAME". */
export function BankruptcyOverlay() {
  const startNewGame = useGameStore((s) => s.startNewGame)

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
      <Heading style={{ fontSize: '2rem', color: 'var(--color-red)' }}>Company Bankrupt</Heading>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480 }}>
        The balance stayed too deep in debt for too long, and the company has run out of road. Time to start a new
        one.
      </p>
      <Button variant="primary" onClick={startNewGame}>
        + START NEW GAME
      </Button>
    </div>
  )
}
