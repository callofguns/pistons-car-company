import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Lock, Wrench } from 'lucide-react'
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
 * the factory line, the one-time tooling cost above it, big side arrows to browse, and the
 * body's class + engine-bay capacity below. CONTINUE charges the tooling cost (first time only per
 * body) and advances to Car Design. Bodies not yet available this year are shown locked. */
export function BodySelectionScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const selectBody = useGameStore((s) => s.selectBody)
  const tooledBodyIds = useGameStore((s) => s.world.vehicles.tooledBodyIds)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)

  const [index, setIndex] = useState(0)
  const [error, setError] = useState(false)
  const tutorialStep = useActiveTutorialStep()
  const { t, fmt } = useT()

  const bodies = CATALOG.bodies
  const body = bodies[index]
  const alreadyTooled = tooledBodyIds.includes(body.id)
  const locked = body.unlockYear > currentYear
  const bodyName = t(`data.body.${body.id}.name` as MessageKey)

  const go = (delta: number) => {
    setError(false)
    setIndex((i) => Math.min(bodies.length - 1, Math.max(0, i + delta)))
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
              {fmt.money(body.productionEquipmentCost)}
            </span>
          </>
        )}
      </div>

      <div className={styles.stage}>
        <span className={styles.watermark} aria-hidden="true">
          {bodyName}
        </span>
        <CarArt bodyId={body.id} variant="bare" className={`${styles.car} ${locked ? styles.carLocked : ''}`} title={bodyName} />
        {locked && (
          <span className={styles.lockBadge}>
            <Lock size={16} />
            {t('bodySelection.unlocksIn', { year: body.unlockYear })}
          </span>
        )}
      </div>

      <Button className={`${styles.sideArrow} ${styles.sideArrowLeft}`} onClick={() => go(-1)} disabled={index === 0} aria-label={t('common.previous')}>
        <ArrowLeft size={26} strokeWidth={2.5} />
      </Button>
      <Button
        className={`${styles.sideArrow} ${styles.sideArrowRight}`}
        onClick={() => go(1)}
        disabled={index === bodies.length - 1}
        aria-label={t('common.next')}
      >
        <ArrowRight size={26} strokeWidth={2.5} />
      </Button>

      <div className={styles.info}>
        <span className={styles.counter}>
          {index + 1} / {bodies.length}
        </span>
        <div className={styles.classRow}>
          <Button className={styles.smallArrow} onClick={() => go(-1)} disabled={index === 0} aria-label={t('common.previous')}>
            <ChevronLeft size={18} />
          </Button>
          <div className={styles.className}>
            <span className={styles.bodyName}>{bodyName}</span>
            <span className={styles.carClass}>{t(CAR_CLASS_KEY[body.carClass])}</span>
          </div>
          <Button className={styles.smallArrow} onClick={() => go(1)} disabled={index === bodies.length - 1} aria-label={t('common.next')}>
            <ChevronRight size={18} />
          </Button>
        </div>
        <div className={styles.dots} aria-hidden="true">
          {bodies.map((b, i) => (
            <span key={b.id} className={`${styles.dot} ${i === index ? styles.dotActive : ''}`} />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        {error && <span className={styles.error}>{t('bodySelection.notEnoughCash')}</span>}
        <Button
          variant="primary"
          data-tutorial-target="body-continue"
          className={`${styles.continue} ${tutorialStep?.step.targetId === 'body-continue' && !locked ? 'tutorial-target-highlight' : ''}`}
          disabled={locked}
          onClick={() => {
            if (selectBody(body.id)) {
              setError(false)
              show('CarDesign')
            } else {
              setError(true)
            }
          }}
        >
          {t('common.continue')}
        </Button>
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
