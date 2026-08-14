import type { ScreenId } from '../store/screenId'
import type { World } from '../core/world'

/** Ids the tutorial can point at, matched against a `data-tutorial-target` attribute on the real
 * button the step wants the player to press. One shared id per physical button rather than per
 * step - CarDesignScreen's Continue/Finish button is a single element reused across several
 * wizard sub-steps, so they all point at the same target. */
export type TutorialTargetId = 'office-create-car' | 'body-continue' | 'wizard-continue'

export interface TutorialStep {
  id: string
  screen: ScreenId
  /** CarDesign only - gates this step to one wizard sub-step. CarDesignScreen reports its current
   * sub-step id into useTutorialStore since that id is local React state, not global world state. */
  wizardStepId?: string
  /** Extra gate beyond screen/wizardStepId, e.g. "only once a car exists". Checked against the live world. */
  condition?: (world: World) => boolean
  /** When set, this step is action-gated rather than click-through: TutorialCard hides its own
   * Next button (only Skip remains) and the matching screen compares this id against its own
   * useActiveTutorialStep() result to add the pulsing tutorial-target-highlight class to the real
   * button (also tagged data-tutorial-target for anyone inspecting the DOM). Progress comes from
   * the player actually pressing that button - which, per the module doc below, naturally stops
   * this step matching - not from a generic "Next" tap. Omit for purely narrative steps with no
   * single button to point at. */
  targetId?: TutorialTargetId
  title: string
  message: string
}

/**
 * The full tutorial script, in display order. TutorialOverlay picks the first step in this array
 * whose screen/wizardStepId/condition all match the player's current context and that hasn't
 * already been dismissed - so steps advance themselves as the player navigates or acts, and a
 * step the player triggers by clicking through (e.g. Create Car, Continue) simply stops matching
 * rather than needing to be dismissed explicitly. See TutorialOverlay.tsx.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'office-welcome',
    screen: 'OfficeHub',
    title: 'Welcome to Pistons',
    message:
      "I'll show you around, then help you design your first car. The Office is home base - you'll return here between every decision.",
  },
  {
    id: 'office-sales',
    screen: 'OfficeHub',
    title: 'Sales panel',
    message: "This tracks your top-selling models and recent sales trends. It's empty for now - that changes once you've got a car on the lot.",
  },
  {
    id: 'office-nav',
    screen: 'OfficeHub',
    title: 'Getting around',
    message:
      'R&D unlocks new parts, Promo runs ad campaigns, Models reviews everything you sell, Racing is a later-game team, and Staff manages your workforce and their wages.',
  },
  {
    id: 'office-hud',
    screen: 'OfficeHub',
    title: 'The top bar',
    message:
      'Reputation, population served, cash balance, and the date - always visible. ▶/⏸/⏩ control time itself: sales and bills only happen while unpaused.',
  },
  {
    id: 'office-create-car',
    screen: 'OfficeHub',
    targetId: 'office-create-car',
    title: 'Time to build',
    message: 'Tap the highlighted + CREATE CAR button to start designing your first vehicle.',
  },
  {
    id: 'body-selection',
    screen: 'BodySelection',
    title: 'Choose a body',
    message:
      "Swipe through the available bodies with the arrows. Each has its own class, engine bay size, and a one-time production tooling cost the first time you use it.",
  },
  {
    id: 'body-continue',
    screen: 'BodySelection',
    targetId: 'body-continue',
    title: 'Lock it in',
    message: 'Happy with one? Tap the highlighted ✓ CONTINUE button to start designing it.',
  },
  {
    id: 'wizard-classification',
    screen: 'CarDesign',
    wizardStepId: 'Classification',
    targetId: 'wizard-continue',
    title: 'Classification',
    message:
      'Pick one Class (Budget through Luxury) and one Type (Off-Road, Sport, or Track) - together they decide which buyers your car appeals to. Then tap the highlighted CONTINUE button.',
  },
  {
    id: 'wizard-safety',
    screen: 'CarDesign',
    wizardStepId: 'Safety',
    title: 'Component steps',
    message:
      "Every part step works the same way: pricier parts cost more but improve your stats. This one is Safety - the rest of the wizard (Transmission, Tires, Interior, and so on) follows the same pattern.",
  },
  {
    id: 'wizard-safety-rating',
    screen: 'CarDesign',
    wizardStepId: 'SafetyRating',
    title: 'Safety rating',
    message: "Your star rating from the parts you just picked. More stars means safer cars and happier buyers.",
  },
  {
    id: 'wizard-engine',
    screen: 'CarDesign',
    wizardStepId: 'Engine',
    title: 'Engine',
    message: 'Pick an engine preset and watch the spec sheet - Power, Torque, Fuel Consumption, Reliability, and Weight all shape how this car sells.',
  },
  {
    id: 'wizard-finish',
    screen: 'CarDesign',
    wizardStepId: 'Finish',
    targetId: 'wizard-continue',
    title: 'Name it',
    message: "Give your car a name (or keep the one I generated for you), then tap the highlighted CONTINUE button.",
  },
  {
    id: 'wizard-pricing',
    screen: 'CarDesign',
    wizardStepId: 'Pricing',
    targetId: 'wizard-continue',
    title: 'Set a price',
    message:
      'Price above your Cost Price to turn a profit. The suggested price balances margin against what buyers in your segment expect - then tap the highlighted ✓ FINISH button to put it into production.',
  },
  {
    id: 'lineup-finale',
    screen: 'ModelLineup',
    title: "You're on the lot",
    message:
      "🎉 Your first car is in production and will start selling back at the Office. From here you can review its specs, adjust the price, or start a restyle any time. Good luck out there.",
  },
]
