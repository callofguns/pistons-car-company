import type { ScreenId } from '../store/screenId'
import type { World } from '../core/world'
import type { MessageKey } from '../i18n/keys'
import { isInDevelopment } from '../core/development'
import { carsOnOrder } from '../core/factory'

/** The first-car walkthrough only applies until the first car exists (later steps stay active
 * after it, so these must not reappear when a second car is designed). */
function firstCarNotDesigned(world: World): boolean {
  return world.vehicles.models.length === 0
}

/** A car has finished development but has no stock and nothing on order - the moment a new
 * player is most likely to get stuck, since nothing sells until cars are ordered. */
function needsFirstOrder(world: World): boolean {
  return world.vehicles.models.some((m) => !isInDevelopment(m) && m.inventory === 0 && carsOnOrder(world.factory, m.id) === 0)
}

/** Ids the tutorial can point at, matched against a `data-tutorial-target` attribute on the real
 * button the step wants the player to press. One shared id per physical button rather than per
 * step - CarDesignScreen's Continue/Finish button is a single element reused across several
 * wizard sub-steps, so they all point at the same target. */
export type TutorialTargetId = 'office-create-car' | 'body-continue' | 'wizard-continue' | 'office-factory' | 'factory-order'

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
  /** Message keys, not raw strings - TutorialCard resolves these through the current locale via
   * t(). Small table (13 entries), no test builds a fixture literal of this type, so explicit
   * fields (rather than PR 3's id-derived pattern for the bigger data tables) are the right
   * tradeoff here - a typo'd key is a compile error instead of needing a walking test. */
  titleKey: MessageKey
  messageKey: MessageKey
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
    titleKey: 'tutorial.officeWelcome.title',
    messageKey: 'tutorial.officeWelcome.message',
  },
  {
    id: 'office-sales',
    screen: 'OfficeHub',
    titleKey: 'tutorial.officeSales.title',
    messageKey: 'tutorial.officeSales.message',
  },
  {
    id: 'office-nav',
    screen: 'OfficeHub',
    titleKey: 'tutorial.officeNav.title',
    messageKey: 'tutorial.officeNav.message',
  },
  {
    id: 'office-hud',
    screen: 'OfficeHub',
    titleKey: 'tutorial.officeHud.title',
    messageKey: 'tutorial.officeHud.message',
  },
  {
    id: 'office-create-car',
    condition: firstCarNotDesigned,
    screen: 'OfficeHub',
    targetId: 'office-create-car',
    titleKey: 'tutorial.officeCreateCar.title',
    messageKey: 'tutorial.officeCreateCar.message',
  },
  {
    id: 'body-selection',
    condition: firstCarNotDesigned,
    screen: 'BodySelection',
    titleKey: 'tutorial.bodySelection.title',
    messageKey: 'tutorial.bodySelection.message',
  },
  {
    id: 'body-continue',
    condition: firstCarNotDesigned,
    screen: 'BodySelection',
    targetId: 'body-continue',
    titleKey: 'tutorial.bodyContinue.title',
    messageKey: 'tutorial.bodyContinue.message',
  },
  {
    id: 'wizard-classification',
    condition: firstCarNotDesigned,
    screen: 'CarDesign',
    wizardStepId: 'Classification',
    targetId: 'wizard-continue',
    titleKey: 'tutorial.wizardClassification.title',
    messageKey: 'tutorial.wizardClassification.message',
  },
  {
    id: 'wizard-safety',
    condition: firstCarNotDesigned,
    screen: 'CarDesign',
    wizardStepId: 'Safety',
    titleKey: 'tutorial.wizardSafety.title',
    messageKey: 'tutorial.wizardSafety.message',
  },
  {
    id: 'wizard-safety-rating',
    condition: firstCarNotDesigned,
    screen: 'CarDesign',
    wizardStepId: 'SafetyRating',
    titleKey: 'tutorial.wizardSafetyRating.title',
    messageKey: 'tutorial.wizardSafetyRating.message',
  },
  {
    id: 'wizard-engine',
    condition: firstCarNotDesigned,
    screen: 'CarDesign',
    wizardStepId: 'Engine',
    titleKey: 'tutorial.wizardEngine.title',
    messageKey: 'tutorial.wizardEngine.message',
  },
  {
    id: 'wizard-finish',
    condition: firstCarNotDesigned,
    screen: 'CarDesign',
    wizardStepId: 'Finish',
    targetId: 'wizard-continue',
    titleKey: 'tutorial.wizardFinish.title',
    messageKey: 'tutorial.wizardFinish.message',
  },
  {
    id: 'wizard-pricing',
    condition: firstCarNotDesigned,
    screen: 'CarDesign',
    wizardStepId: 'Pricing',
    targetId: 'wizard-continue',
    titleKey: 'tutorial.wizardPricing.title',
    messageKey: 'tutorial.wizardPricing.message',
  },
  {
    id: 'lineup-finale',
    screen: 'ModelLineup',
    titleKey: 'tutorial.lineupFinale.title',
    messageKey: 'tutorial.lineupFinale.message',
  },
  {
    id: 'office-wait',
    screen: 'OfficeHub',
    condition: (world) => world.vehicles.models.some(isInDevelopment),
    titleKey: 'tutorial.officeWait.title',
    messageKey: 'tutorial.officeWait.message',
  },
  {
    id: 'office-factory',
    screen: 'OfficeHub',
    targetId: 'office-factory',
    condition: needsFirstOrder,
    titleKey: 'tutorial.officeFactory.title',
    messageKey: 'tutorial.officeFactory.message',
  },
  {
    id: 'factory-order',
    screen: 'Factory',
    targetId: 'factory-order',
    condition: needsFirstOrder,
    titleKey: 'tutorial.factoryOrder.title',
    messageKey: 'tutorial.factoryOrder.message',
  },
  {
    id: 'factory-done',
    screen: 'Factory',
    titleKey: 'tutorial.factoryDone.title',
    messageKey: 'tutorial.factoryDone.message',
  },
]
