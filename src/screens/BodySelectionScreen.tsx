import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { CATALOG } from '../data/catalog'
import { compact } from '../core/numberFormat'
import { CarCarousel } from '../components/CarCarousel'
import { MeterBar } from '../components/MeterBar'
import { TutorialCard } from '../components/TutorialCard'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/** Step 1 of the design wizard - runs full-screen (see SCREENS_WITHOUT_HUD), so its own back
 * button is what gets the player out, not the persistent top bar. Selecting CONTINUE charges the
 * one-time tooling cost (first time only per body) and advances to Car Design. */
export function BodySelectionScreen() {
  const show = useUiStore((s) => s.show)
  const back = useUiStore((s) => s.back)
  useGameStore((s) => s.revision)
  const selectBody = useGameStore((s) => s.selectBody)
  const tooledBodyIds = useGameStore((s) => s.world.vehicles.tooledBodyIds)

  const [index, setIndex] = useState(0)
  const [error, setError] = useState(false)
  const tutorialStep = useActiveTutorialStep()

  const bodies = CATALOG.bodies
  const body = bodies[index]
  const alreadyTooled = tooledBodyIds.includes(body.id)

  return (
    <div
      className={`${styles.screen} ${styles.centered} ${styles.narrow}`}
      style={{ position: 'relative', justifyContent: 'center' }}
    >
      <Button
        style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', width: 44, height: 44, padding: 0 }}
        onClick={back}
        aria-label="Back"
      >
        ‹
      </Button>

      {tutorialStep && <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />}

      <span style={{ color: 'var(--color-green)', fontSize: '1.1rem' }}>
        Production equipment cost: {alreadyTooled ? 'Owned' : compact(body.productionEquipmentCost)}
      </span>

      <div style={{ width: '100%' }}>
        <CarCarousel
          indexOneBased={index + 1}
          total={bodies.length}
          onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => Math.min(bodies.length - 1, i + 1))}
        />
      </div>

      <Heading>{body.displayName}</Heading>
      <span style={{ color: 'var(--color-text-secondary)' }}>{body.carClass.toUpperCase()}</span>

      <div style={{ width: '100%' }}>
        <MeterBar value01={Math.min(1, body.engineBayCapacityLiters / 12)} displayValue={`${body.engineBayCapacityLiters} L.`} />
      </div>

      {error && <span style={{ color: 'var(--color-red)' }}>Not enough cash for this body's tooling.</span>}

      <Button
        variant="primary"
        style={{ width: '100%' }}
        onClick={() => {
          if (selectBody(body.id)) {
            setError(false)
            show('CarDesign')
          } else {
            setError(true)
          }
        }}
      >
        ✓ CONTINUE
      </Button>
    </div>
  )
}
