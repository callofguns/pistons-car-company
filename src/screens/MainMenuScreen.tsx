import { useUiStore } from '../store/useUiStore'
import { DEFAULT_GAME_CONFIG } from '../core/gameConfig'
import { APP_VERSION } from '../version'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import menuStyles from './MainMenuScreen.module.css'

/** SAVES is the single gateway into actually playing - it opens the Save Slots screen, which
 * handles both resuming an existing company and starting a new one (its own "+ NEW GAME" button),
 * so there's no separate Continue/New Game split to keep in sync with whether any slot has data.
 * Header pinned to the top, buttons centered in the space below it, version number tucked into the
 * bottom-right corner. */
export function MainMenuScreen() {
  const show = useUiStore((s) => s.show)

  return (
    <div className={`${styles.screen} ${menuStyles.menu}`}>
      <div className={menuStyles.plate}>
        <span className={menuStyles.eyebrow}>Est. {DEFAULT_GAME_CONFIG.startYear}</span>
        <Heading className={menuStyles.header}>Pistons: Car Company Inc</Heading>
      </div>

      <div className={menuStyles.buttons}>
        <Button variant="primary" onClick={() => show('SaveSlots')}>
          SAVES
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
