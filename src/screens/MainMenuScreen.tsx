import { useUiStore } from '../store/useUiStore'
import { listSlots } from '../core/save'
import { APP_VERSION } from '../version'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import menuStyles from './MainMenuScreen.module.css'

/** CONTINUE opens the Save Slots screen to pick which company to resume - hidden entirely if no
 * slot has anything in it yet (a first-time player has nothing to continue). "+" starts the
 * Company Naming -> (usually) straight into a fresh game flow; only falls through to Save Slots
 * itself if every slot is already taken. Header pinned to the top, buttons centered in the space
 * below it, version number tucked into the bottom-right corner. */
export function MainMenuScreen() {
  const show = useUiStore((s) => s.show)

  const hasAnySave = listSlots().some((slot) => slot !== null)

  return (
    <div className={`${styles.screen} ${menuStyles.menu}`}>
      <Heading className={menuStyles.header}>Pistons: Car Company Inc</Heading>

      <div className={menuStyles.buttons}>
        {hasAnySave && (
          <Button variant="primary" onClick={() => show('SaveSlots')}>
            ▶ CONTINUE
          </Button>
        )}
        <Button onClick={() => show('CompanyNaming')}>+ NEW GAME</Button>
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
