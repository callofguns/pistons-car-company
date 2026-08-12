import { useActiveTutorialStep } from '../store/useTutorialStore'
import { TutorialCard } from './TutorialCard'
import styles from './TutorialOverlay.module.css'

/**
 * App-level floating coach card - but only for Office Hub. That screen's real content lives
 * entirely in its four corners (see OfficeHubScreen.module.css), leaving a dead center a fixed
 * overlay can safely sit in. Every other tutorial screen packs content edge to edge on a short
 * landscape phone, so those embed a TutorialCard directly in their own layout flow instead (see
 * BodySelectionScreen, CarDesignScreen, ModelLineupScreen) rather than risk this floating on top
 * of their Continue button. Rendered once here, alongside RotateDeviceGate, so App.tsx doesn't
 * need to know which screen is active.
 */
export function TutorialOverlay() {
  const active = useActiveTutorialStep()
  if (!active || active.step.screen !== 'OfficeHub') return null

  return (
    <div className={styles.wrap}>
      <TutorialCard step={active.step} onNext={active.next} onSkip={active.skip} />
    </div>
  )
}
