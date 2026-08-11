import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { APP_VERSION } from '../version'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** CONTINUE resumes whatever was loaded at startup (a save, or a fresh $250,000 game). "+" wipes the save and starts over immediately - no scene-reload subtlety needed on the web like the Unity port had. */
export function MainMenuScreen() {
  const show = useUiStore((s) => s.show)
  const startNewGame = useGameStore((s) => s.startNewGame)

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`} style={{ justifyContent: 'center' }}>
      <Heading style={{ fontSize: '2rem' }}>CARCOMPANY TYCOON</Heading>
      <span style={{ color: 'var(--color-text-secondary)' }}>{APP_VERSION}</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 24 }}>
        <Button variant="primary" onClick={() => show('OfficeHub')}>
          ▶ CONTINUE
        </Button>
        <Button
          onClick={() => {
            startNewGame()
            show('OfficeHub')
          }}
        >
          + NEW GAME
        </Button>
        <Button variant="ghost" onClick={() => console.log('[MainMenu] News - not implemented yet.')}>
          NEWS
        </Button>
        <Button variant="ghost" onClick={() => console.log('[MainMenu] Language - not implemented yet.')}>
          LANGUAGE
        </Button>
      </div>
    </div>
  )
}
