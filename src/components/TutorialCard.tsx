import type { TutorialStep } from '../data/tutorialSteps'
import { TUTORIAL_STEPS } from '../data/tutorialSteps'
import { useT } from '../i18n/useT'
import { Button } from './Primitives'
import styles from './TutorialCard.module.css'

interface TutorialCardProps {
  step: TutorialStep
  onNext: () => void
  onSkip: () => void
}

/** The coach-card presentation only, shared by TutorialOverlay (a fixed/centered overlay - the
 * right fit for Office Hub, whose real content lives in the four screen corners and leaves a dead
 * center) and the wizard screens (BodySelection, CarDesign, ModelLineup), which embed this
 * directly in their own layout flow instead - those screens are already packed edge to edge on a
 * short landscape phone, so a floating overlay there would sit on top of the Continue button
 * rather than beside it. */
export function TutorialCard({ step, onNext, onSkip }: TutorialCardProps) {
  const { t } = useT()
  const stepNumber = TUTORIAL_STEPS.findIndex((s) => s.id === step.id) + 1
  const isLastStep = stepNumber === TUTORIAL_STEPS.length

  return (
    <div className={styles.card}>
      <div className={styles.portrait} aria-hidden="true">
        🧭
      </div>
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <span className={styles.title}>{t(step.titleKey)}</span>
          <span className={styles.progress}>
            {stepNumber}/{TUTORIAL_STEPS.length}
          </span>
        </div>
        <p className={styles.message}>{t(step.messageKey)}</p>
        <div className={styles.actions}>
          <button className={styles.skipLink} onClick={onSkip}>
            {t('common.skipTutorial')}
          </button>
          {/* Action-gated steps (step.targetId set) drop the Next button entirely - progress only
             comes from actually pressing the highlighted button out on the screen, which stops
             this step matching on its own (see useActiveTutorialStep). Next stays only for
             narrative steps with no single button to point at. */}
          {step.targetId ? (
            <span className={styles.hint}>{t('tutorial.tapHighlighted')}</span>
          ) : (
            <Button variant="primary" onClick={onNext}>
              {isLastStep ? t('tutorial.gotIt') : t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
