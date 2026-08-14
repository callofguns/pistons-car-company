import { useGameStore } from '../store/useGameStore'
import { useT } from '../i18n/useT'
import { Button, Heading } from './Primitives'

/** Full-screen soft-fail state, rendered by App.tsx in place of the normal screen router once
 * world.company.isBankrupt is true. Restarts fresh in the same save slot under the same company
 * name rather than routing back through Main Menu's naming/slot-picker flow. */
export function BankruptcyOverlay() {
  const restartAfterBankruptcy = useGameStore((s) => s.restartAfterBankruptcy)
  const { t } = useT()

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
      <Heading style={{ fontSize: '2rem', color: 'var(--color-danger)' }}>{t('bankruptcy.title')}</Heading>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480 }}>{t('bankruptcy.message')}</p>
      <Button variant="primary" onClick={restartAfterBankruptcy}>
        {t('bankruptcy.startNewGame')}
      </Button>
    </div>
  )
}
