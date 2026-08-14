import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { DEFAULT_GAME_CONFIG } from '../core/gameConfig'
import { APP_VERSION } from '../version'
import { Button, Heading } from '../components/Primitives'
import { listSlots } from '../core/save'
import styles from './screen.module.css'
import menuStyles from './MainMenuScreen.module.css'

/** Finds the slot to offer as a one-tap resume, or null for a player with no saves at all (first
 * time playing, or every save deleted) - picked by most recent savedAtUnixMs rather than always
 * slot 0, so it tracks whichever company the player actually played last across the 3 slots. */
type RecentSlot = { index: number; companyName: string; savedAtUnixMs: number }

function findMostRecentSlot(): RecentSlot | null {
  return listSlots().reduce<RecentSlot | null>((best, data, index) => {
    if (!data) return best
    if (best && best.savedAtUnixMs >= data.savedAtUnixMs) return best
    return { index, companyName: data.companyName, savedAtUnixMs: data.savedAtUnixMs }
  }, null)
}

/** SAVES stays the gateway to browsing/switching/deleting saves and starting a new company (its
 * own "+ NEW GAME" button), but a returning player with at least one save gets a one-tap PLAY
 * button above it - named after their own company so it's clear which game it resumes - instead
 * of having to go through Saves every time just to keep playing the same company.
 * Header pinned to the top, buttons centered in the space below it, version number tucked into the
 * bottom-right corner. */
export function MainMenuScreen() {
  const show = useUiStore((s) => s.show)
  const loadSlot = useGameStore((s) => s.loadSlot)

  const mostRecent = findMostRecentSlot()

  const handlePlay = () => {
    if (mostRecent && loadSlot(mostRecent.index)) show('OfficeHub')
  }

  return (
    <div className={`${styles.screen} ${menuStyles.menu}`}>
      <div className={menuStyles.plate}>
        <span className={menuStyles.eyebrow}>Est. {DEFAULT_GAME_CONFIG.startYear}</span>
        <Heading className={menuStyles.header}>Pistons: Car Company Inc</Heading>
      </div>

      <div className={menuStyles.buttons}>
        {mostRecent && (
          <Button variant="primary" className={menuStyles.playButton} onClick={handlePlay}>
            PLAY ({mostRecent.companyName})
          </Button>
        )}
        <Button variant={mostRecent ? 'ghost' : 'primary'} onClick={() => show('SaveSlots')}>
          SAVES
        </Button>
        <Button variant="ghost" onClick={() => console.log('[MainMenu] News - not implemented yet.')}>
          NEWS
        </Button>
        <Button variant="ghost" onClick={() => show('Language')}>
          LANGUAGE
        </Button>
      </div>

      <span className={menuStyles.version}>{APP_VERSION}</span>
    </div>
  )
}
