import { create } from 'zustand'
import { useUiStore } from './useUiStore'
import { useGameStore } from './useGameStore'
import { TUTORIAL_STEPS, type TutorialStep } from '../data/tutorialSteps'

const SEEN_KEY = 'pistons-tutorial-seen'

function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markTutorialSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Private-browsing/storage-disabled - the tutorial just replays next time, which is fine.
  }
}

interface TutorialStore {
  active: boolean
  dismissedIds: Set<string>
  /** CarDesignScreen's current wizard sub-step (e.g. 'Classification', 'Engine') - local React
   * state there, so it's reported in via effect rather than read directly. Null off that screen. */
  wizardStepId: string | null

  /** Begins (or restarts) the guided tour. */
  start: () => void
  /** Marks one step's card as read so TutorialOverlay moves on to the next matching step. */
  dismiss: (stepId: string) => void
  /** Ends the tour, whether the player explicitly skipped it or just read the final card - both
   * mean "don't auto-start this again" so they share this one bit of bookkeeping. */
  skip: () => void
  reportWizardStep: (stepId: string | null) => void
}

/**
 * Drives the guided tour (TutorialOverlay + tutorialSteps.ts). Deliberately separate from
 * useUiStore/useGameStore - it only tracks which coach cards have been read, not game state,
 * and its "has this player ever seen the tutorial" flag lives in localStorage rather than the
 * save schema so it survives "+ NEW GAME" wiping the save.
 */
export const useTutorialStore = create<TutorialStore>((set) => ({
  active: false,
  dismissedIds: new Set(),
  wizardStepId: null,

  start: () => {
    // Starting it (whether auto-triggered on a player's very first game or replayed manually from
    // the Main Menu) is the right moment to stop auto-triggering it again later.
    markTutorialSeen()
    set({ active: true, dismissedIds: new Set() })
  },

  dismiss: (stepId) =>
    set((s) => {
      const next = new Set(s.dismissedIds)
      next.add(stepId)
      return { dismissedIds: next }
    }),

  skip: () => {
    markTutorialSeen()
    set({ active: false })
  },

  reportWizardStep: (stepId) => set({ wizardStepId: stepId }),
}))

export { hasSeenTutorial, markTutorialSeen }

interface ActiveTutorialStep {
  step: TutorialStep
  next: () => void
  skip: () => void
}

/**
 * Resolves which coach card (if any) should show right now, purely from the player's current
 * context - current screen, CarDesign's reported wizard sub-step, and live world state - matched
 * against tutorialSteps.ts in order. Shared by TutorialOverlay (Office Hub's fixed overlay) and
 * the wizard screens that embed a card directly in their own layout; a step naturally stops
 * matching once the player navigates past it, so nothing here needs to track "current index".
 */
export function useActiveTutorialStep(): ActiveTutorialStep | null {
  const active = useTutorialStore((s) => s.active)
  const dismissedIds = useTutorialStore((s) => s.dismissedIds)
  const wizardStepId = useTutorialStore((s) => s.wizardStepId)
  const dismiss = useTutorialStore((s) => s.dismiss)
  const skip = useTutorialStore((s) => s.skip)

  const currentScreen = useUiStore((s) => s.currentScreen)
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)

  if (!active) return null

  const step = TUTORIAL_STEPS.find(
    (candidate) =>
      !dismissedIds.has(candidate.id) &&
      candidate.screen === currentScreen &&
      (candidate.wizardStepId === undefined || candidate.wizardStepId === wizardStepId) &&
      (!candidate.condition || candidate.condition(world)),
  )

  if (!step) return null

  const isLastStep = TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id === step.id
  // Reading the final card ends the tour the same way explicitly skipping does (see skip()'s
  // doc comment) - there's nothing left to dismiss-and-advance to.
  return { step, next: isLastStep ? skip : () => dismiss(step.id), skip }
}
