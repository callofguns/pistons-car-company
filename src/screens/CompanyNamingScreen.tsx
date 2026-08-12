import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useTutorialStore } from '../store/useTutorialStore'
import { listSlots } from '../core/save'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import namingStyles from './CompanyNamingScreen.module.css'

/**
 * Step 1 of "+ NEW GAME" - name the company before anything else exists. Continue auto-picks the
 * first empty save slot for it; if every slot is already taken, it hands off to the Save Slots
 * screen instead of silently overwriting one, so the player explicitly picks what gets replaced.
 */
export function CompanyNamingScreen() {
  const back = useUiStore((s) => s.back)
  const show = useUiStore((s) => s.show)
  const startNewGameInSlot = useGameStore((s) => s.startNewGameInSlot)
  const startTutorial = useTutorialStore((s) => s.start)

  const [name, setName] = useState('')
  const trimmed = name.trim()

  const handleContinue = () => {
    if (!trimmed) return

    const emptySlotIndex = listSlots().findIndex((slot) => slot === null)
    if (emptySlotIndex === -1) {
      show('SaveSlots', { mode: 'new', pendingCompanyName: trimmed })
      return
    }

    startNewGameInSlot(emptySlotIndex, trimmed)
    startTutorial()
    show('OfficeHub')
  }

  return (
    <div
      className={`${styles.screen} ${styles.centered} ${styles.narrow}`}
      style={{ position: 'relative', justifyContent: 'center' }}
    >
      <Button
        style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', width: 44, height: 44, padding: 0 }}
        onClick={back}
        aria-label="Back"
      >
        ‹
      </Button>

      <Heading>YOUR COMPANY NAME:</Heading>

      <input
        className={namingStyles.nameInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
        placeholder="Enter company name:"
        autoFocus
      />

      <Button variant="primary" style={{ width: '100%' }} disabled={!trimmed} onClick={handleContinue}>
        ✓ CONTINUE
      </Button>
    </div>
  )
}
