import { useState } from 'react'
import { bodyItem, unlockedByResearch } from '../core/unlocks'
import { BODY_STYLE_ORDER, designsOfStyle } from '../data/bodies'
import { toolingCost, toolingKey } from '../core/vehicleService'
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, FlaskConical, Lock, Wrench, X } from 'lucide-react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { CATALOG } from '../data/catalog'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { CAR_CLASS_KEY } from '../i18n/vehicles'
import { CarArt } from '../art/CarArt'
import { FactoryBackdrop } from '../art/FactoryBackdrop'
import { MeterBar } from '../components/MeterBar'
import { TutorialCard } from '../components/TutorialCard'
import { Button } from '../components/Primitives'
import styles from './BodySelectionScreen.module.css'

/** The roomiest engine bay in the catalog fills the capacity meter. */
const MAX_BAY_LITERS = Math.max(...CATALOG.bodies.map((b) => b.engineBayCapacityLiters))

/** Step 1 of the design wizard, laid out like the reference: the bare body shell on jack stands on
 * the factory line and the one-time tooling cost above it. Two sets of arrows: the big outer ones
 * change the body DESIGN (the shell itself), the small ones under the car change the body STYLE
 * (sedan, coupe, SUV...). A switch at the top right takes the roof off. CONTINUE charges the
 * tooling cost (first time only per body) and advances to the classification step; a body that
 * has not been researched yet shows GO TO RESEARCH instead. */
export function BodySelectionScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const selectBody = useGameStore((s) => s.selectBody)
  const tooledBodyIds = useGameStore((s) => s.world.vehicles.tooledBodyIds)
  const research = useGameStore((s) => s.world.research)

  const [styleIndex, setStyleIndex] = useState(0)
  const [designIndex, setDesignIndex] = useState(0)
  const [convertible, setConvertible] = useState(false)
  const [error, setError] = useState(false)
  const tutorialStep = useActiveTutorialStep()
  const { t, fmt } = useT()

  const style = BODY_STYLE_ORDER[styleIndex]
  const designs = designsOfStyle(style)
  const body = designs[designIndex]
  const alreadyTooled = tooledBodyIds.includes(toolingKey(body.id, convertible))
  const locked = !unlockedByResearch(research)(bodyItem(body))
  const designName = t(`data.body.${body.id}.name` as MessageKey)
  const styleName = t(CAR_CLASS_KEY[style])

  const changeDesign = (delta: number) => {
    setError(false)
    setDesignIndex((i) => (i + delta + designs.length) % designs.length)
  }
  const changeStyle = (delta: number) => {
    setError(false)
    setDesignIndex(0)
    setStyleIndex((i) => (i + delta + BODY_STYLE_ORDER.length) % BODY_STYLE_ORDER.length)
  }

  return (
    <div className={styles.screen}>
      <FactoryBackdrop className={styles.backdrop} />

      {tutorialStep && (
        <div className={styles.tutorial}>
          <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />
        </div>
      )}

      <div className={styles.cost}>
        {alreadyTooled ? (
          <span className={styles.costLabel}>{t('bodySelection.alreadyTooled')}</span>
        ) : (
          <>
            <span className={styles.costLabel}>{t('bodySelection.equipmentCostLabel')}</span>
            <span className={styles.costValue}>
              <Wrench size={22} />
              {fmt.money(toolingCost(body, convertible))}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={convertible}
        className={styles.convertible}
        onClick={() => setConvertible(!convertible)}
      >
        <span className={`${styles.switchBox} ${convertible ? styles.switchOn : ''}`}>{convertible ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
        {t('bodySelection.convertible')}
      </button>

      <div className={styles.stage}>
        {locked ? (
          <>
            <Lock className={styles.lockIcon} size={34} />
            <span className={styles.watermark} aria-hidden="true">
              {t('bodySelection.notResearched')}
            </span>
          </>
        ) : (
          <span className={styles.watermark} aria-hidden="true">
            {designName}
          </span>
        )}
        <CarArt
          bodyId={body.id}
          variant="bare"
          convertible={convertible}
          className={`${styles.car} ${locked ? styles.carLocked : ''}`}
          title={designName}
        />
      </div>

      <Button
        className={`${styles.sideArrow} ${styles.sideArrowLeft}`}
        onClick={() => changeDesign(-1)}
        disabled={designs.length < 2}
        aria-label={t('bodySelection.previousDesign')}
      >
        <ArrowLeft size={26} strokeWidth={2.5} />
      </Button>
      <Button
        className={`${styles.sideArrow} ${styles.sideArrowRight}`}
        onClick={() => changeDesign(1)}
        disabled={designs.length < 2}
        aria-label={t('bodySelection.nextDesign')}
      >
        <ArrowRight size={26} strokeWidth={2.5} />
      </Button>

      <div className={styles.info}>
        <span className={styles.counter}>
          {styleIndex + 1} / {BODY_STYLE_ORDER.length}
        </span>
        <div className={styles.classRow}>
          <Button className={styles.smallArrow} onClick={() => changeStyle(-1)} aria-label={t('bodySelection.previousStyle')}>
            <ChevronLeft size={18} />
          </Button>
          <div className={styles.className}>
            <span className={styles.carClass}>{styleName}</span>
          </div>
          <Button className={styles.smallArrow} onClick={() => changeStyle(1)} aria-label={t('bodySelection.nextStyle')}>
            <ChevronRight size={18} />
          </Button>
        </div>
        <div className={styles.dots} aria-hidden="true">
          {BODY_STYLE_ORDER.map((s, i) => (
            <span key={s} className={`${styles.dot} ${i === styleIndex ? styles.dotActive : ''}`} />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        {error && <span className={styles.error}>{t('bodySelection.notEnoughCash')}</span>}
        {locked ? (
          <Button className={styles.continue} onClick={() => show('Research')}>
            <FlaskConical size={18} />
            {t('bodySelection.goToResearch')}
          </Button>
        ) : (
          <Button
            variant="primary"
            data-tutorial-target="body-continue"
            className={`${styles.continue} ${tutorialStep?.step.targetId === 'body-continue' ? 'tutorial-target-highlight' : ''}`}
            onClick={() => {
              if (selectBody(body.id, convertible)) {
                setError(false)
                show('CarDesign')
              } else {
                setError(true)
              }
            }}
          >
            {t('common.continue')}
          </Button>
        )}
      </div>

      <div className={styles.capacity}>
        <span className={styles.capacityLabel}>{t('bodySelection.bodyCapacity')}</span>
        <div className={styles.capacityRow}>
          <MeterBar value01={body.engineBayCapacityLiters / MAX_BAY_LITERS} />
          <span className={styles.capacityValue}>{t('bodySelection.engineBay', { value: body.engineBayCapacityLiters })}</span>
        </div>
      </div>
    </div>
  )
}
