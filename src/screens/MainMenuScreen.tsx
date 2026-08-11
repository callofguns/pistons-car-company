import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { APP_VERSION } from '../version'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import menuStyles from './MainMenuScreen.module.css'

/** CONTINUE resumes whatever was loaded at startup (a save, or a fresh $250,000 game). "+" wipes the save and starts over immediately - no scene-reload subtlety needed on the web like the Unity port had.
 * Header pinned to the top, buttons centered in the space below it, version number tucked into the bottom-right corner. */
export function MainMenuScreen() {
  const show = useUiStore((s) => s.show)
  const startNewGame = useGameStore((s) => s.startNewGame)

  return (
    <div className={`${styles.screen} ${menuStyles.menu}`}>
      <Heading className={menuStyles.header}>Pistons: Car Company Inc</Heading>

      <div className={menuStyles.buttons}>
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

      <span className={menuStyles.version}>{APP_VERSION}</span>
    </div>
  )
}
