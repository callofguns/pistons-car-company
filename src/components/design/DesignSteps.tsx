import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Dices } from 'lucide-react'
import { useGameStore } from '../../store/useGameStore'
import { partItem, unlockedByResearch } from '../../core/unlocks'
import { DEFAULT_PAINT, DEFAULT_TUNING, paintHex, randomPaint } from '../../core/carTuning'
import type { BodyStyleDefinition } from '../../core/vehicles'
import type { DesignStatKey } from '../../core/designStats'
import { findDesignStep, type ComponentOption } from '../../data/designSteps'
import { BARE_METAL, CarArt } from '../../art/CarArt'
import { useT } from '../../i18n/useT'
import { Button } from '../Primitives'
import { StepFrame } from './StepFrame'
import { PartsPanel, useTranslatedSlots } from './PartsPanel'
import { ComponentSlotCard } from './ComponentSlotCard'
import { CarSpecsPanel, ContinueButton, StepMeters } from './shared'
import styles from './DesignSteps.module.css'

export interface DesignStepProps {
  stepId: string
  body: BodyStyleDefinition
  tabs: ReactNode
  onContinue: () => void
  highlightContinue: boolean
  tutorial?: ReactNode
}

/** What every step needs from the game: the design in progress and how to change it. */
function useDesign() {
  const session = useGameStore((s) => s.world.vehicles.currentSession)
  const research = useGameStore((s) => s.world.research)
  const previewCurrentStats = useGameStore((s) => s.previewCurrentStats)
  const setComponentSelection = useGameStore((s) => s.setComponentSelection)
  const setDesignTuning = useGameStore((s) => s.setDesignTuning)
  const setPaint = useGameStore((s) => s.setPaint)
  useGameStore((s) => s.revision)
  const check = unlockedByResearch(research)
  return {
    session,
    stats: previewCurrentStats(),
    isUnlocked: (slotId: string, option: ComponentOption) => check(partItem(slotId, option)),
    setComponentSelection,
    setDesignTuning,
    setPaint,
    paint: session?.paint ?? DEFAULT_PAINT,
    tuning: session?.tuning ?? DEFAULT_TUNING,
  }
}

function metersOf(stepId: string): DesignStatKey[] {
  return findDesignStep(stepId)?.meters ?? []
}

function StageCar({ body, color, tutorial, cutaway }: { body: BodyStyleDefinition; color?: string; tutorial?: ReactNode; cutaway?: boolean }) {
  const session = useGameStore((s) => s.world.vehicles.currentSession)
  return (
    <>
      <CarArt bodyId={body.id} color={color ?? BARE_METAL} convertible={session?.convertible} cutaway={cutaway} className={styles.car} />
      {tutorial && <div className={styles.tutorial}>{tutorial}</div>}
    </>
  )
}

/** Transmission, Undercarriage and Tires: the spec sheet on the left, parts on the right with
 * arrows to step through them. */
export function PartsStep({ stepId, body, tabs, onContinue, highlightContinue, tutorial }: DesignStepProps) {
  const d = useDesign()
  const [part, setPart] = useState(0)
  if (!d.session) return null
  return (
    <StepFrame
      backdrop="factory"
      left={<CarSpecsPanel stats={d.stats} engineLiters={d.session.engine.displacementLiters} />}
      tabs={tabs}
      costPrice={d.stats?.unitCost ?? null}
      stage={<StageCar body={body} tutorial={tutorial} />}
      bottom={<StepMeters keys={metersOf(stepId)} stats={d.stats} />}
      continueButton={<ContinueButton onClick={onContinue} highlight={highlightContinue} />}
      right={
        <PartsPanel
          stepId={stepId}
          part={part}
          onPart={setPart}
          selections={d.session.componentSelections}
          isUnlocked={d.isUnlocked}
          onSelect={d.setComponentSelection}
          tuning={d.tuning}
          onTuning={d.setDesignTuning}
        />
      }
    />
  )
}

/** Interior: the car shown see-through with its seats, an options picker on the left. */
export function InteriorStep({ stepId, body, tabs, onContinue, highlightContinue, tutorial }: DesignStepProps) {
  const { t } = useT()
  const d = useDesign()
  const slots = useTranslatedSlots()
  const [part, setPart] = useState(0)
  if (!d.session) return null
  const material = slots.get('interior-material')
  const unlocked = material?.options.filter((o) => d.isUnlocked('interior-material', o)) ?? []
  const index = Math.max(0, unlocked.findIndex((o) => o.id === d.session?.componentSelections['interior-material']))
  const move = (delta: number) => {
    if (unlocked.length > 0) d.setComponentSelection('interior-material', unlocked[(index + delta + unlocked.length) % unlocked.length].id)
  }
  return (
    <StepFrame
      backdrop="paint"
      left={
        <div className={styles.optionsLeft}>
          <div className={styles.picker}>
            <button type="button" className={styles.pickerArrow} onClick={() => move(-1)} aria-label={t('engineBuilder.previousPart')}>
              <ChevronLeft size={18} />
            </button>
            <span className={styles.pickerLabel}>{t('carDesign.interior.options')}</span>
            <button type="button" className={styles.pickerArrow} onClick={() => move(1)} aria-label={t('engineBuilder.nextPart')}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className={styles.tiles}>
            {unlocked.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.tile} ${option.id === unlocked[index]?.id ? styles.tileSelected : ''}`}
                onClick={() => d.setComponentSelection('interior-material', option.id)}
              >
                <span className={styles.seat} data-material={option.id} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      }
      tabs={tabs}
      costPrice={d.stats?.unitCost ?? null}
      stage={<StageCar body={body} color={BARE_METAL} cutaway tutorial={tutorial} />}
      bottom={<StepMeters keys={metersOf(stepId)} stats={d.stats} />}
      right={
        <>
          <PartsPanel
            stepId={stepId}
            part={part}
            onPart={setPart}
            selections={d.session.componentSelections}
            isUnlocked={d.isUnlocked}
            onSelect={d.setComponentSelection}
            tuning={d.tuning}
            onTuning={d.setDesignTuning}
          />
          <ContinueButton onClick={onContinue} highlight={highlightContinue} />
        </>
      }
    />
  )
}

/** Appearance: pick the paint colour with two sliders, then the finish and wheels. */
export function AppearanceStep({ stepId, body, tabs, onContinue, highlightContinue, tutorial }: DesignStepProps) {
  const { t } = useT()
  const d = useDesign()
  const slots = useTranslatedSlots()
  const [mode, setMode] = useState(0)
  if (!d.session) return null
  const MODES = ['carDesign.appearance.primaryColor', 'carDesign.appearance.finish', 'carDesign.appearance.wheels'] as const
  const modeSlot = mode === 1 ? slots.get('paint-finish') : mode === 2 ? slots.get('wheel-style') : undefined
  const modeSlotId = mode === 1 ? 'paint-finish' : 'wheel-style'
  const step = (delta: number) => setMode((m) => (m + delta + MODES.length) % MODES.length)
  const random = () => {
    d.setPaint(randomPaint())
    for (const id of ['paint-finish', 'wheel-style']) {
      const slot = slots.get(id)
      const open = slot?.options.filter((o) => d.isUnlocked(id, o)) ?? []
      if (open.length > 0) d.setComponentSelection(id, open[Math.floor(Math.random() * open.length)].id)
    }
  }
  return (
    <StepFrame
      backdrop="paint"
      left={
        <div className={styles.optionsLeft}>
          <div className={styles.picker}>
            <button type="button" className={styles.pickerArrow} onClick={() => step(-1)} aria-label={t('engineBuilder.previousPart')}>
              <ChevronLeft size={18} />
            </button>
            <span className={styles.pickerLabel}>{t(MODES[mode])}</span>
            <button type="button" className={styles.pickerArrow} onClick={() => step(1)} aria-label={t('engineBuilder.nextPart')}>
              <ChevronRight size={18} />
            </button>
          </div>
          {mode === 0 ? (
            <div className={styles.sliders}>
              <input
                type="range"
                className={styles.hue}
                min={0}
                max={360}
                value={d.paint.hue}
                onChange={(e) => d.setPaint({ ...d.paint, hue: Number(e.target.value) })}
                aria-label={t('carDesign.appearance.primaryColor')}
              />
              <input
                type="range"
                className={styles.light}
                style={{ ['--paint' as string]: paintHex({ hue: d.paint.hue, light: 50 }) }}
                min={15}
                max={85}
                value={d.paint.light}
                onChange={(e) => d.setPaint({ ...d.paint, light: Number(e.target.value) })}
                aria-label={t('carDesign.appearance.primaryColor')}
              />
            </div>
          ) : (
            modeSlot && (
              <ComponentSlotCard
                slot={modeSlot}
                selectedOptionId={d.session.componentSelections[modeSlotId]}
                isOptionUnlocked={(option) => d.isUnlocked(modeSlotId, option)}
                onSelect={(id) => d.setComponentSelection(modeSlotId, id)}
              />
            )
          )}
        </div>
      }
      tabs={tabs}
      costPrice={d.stats?.unitCost ?? null}
      stage={<StageCar body={body} color={paintHex(d.paint)} tutorial={tutorial} />}
      right={
        <div className={styles.appearanceRight}>
          <Button className={styles.random} onClick={random}>
            <Dices size={16} />
            {t('carDesign.appearance.random')}
          </Button>
          <div className={styles.grow} />
          <StepMeters keys={metersOf(stepId)} stats={d.stats} />
          <ContinueButton onClick={onContinue} highlight={highlightContinue} />
        </div>
      }
    />
  )
}

/** Aerodynamics: slide between lift and downforce in the wind tunnel. */
export function AeroStep({ stepId, body, tabs, onContinue, highlightContinue, tutorial }: DesignStepProps) {
  const { t } = useT()
  const d = useDesign()
  const slots = useTranslatedSlots()
  if (!d.session) return null
  const kit = slots.get('aero-package')
  const down = d.tuning.downforcePct
  return (
    <StepFrame
      backdrop="tunnel"
      left={<CarSpecsPanel stats={d.stats} engineLiters={d.session.engine.displacementLiters} />}
      tabs={tabs}
      costPrice={d.stats?.unitCost ?? null}
      stage={
        <>
          <StageCar body={body} color={paintHex(d.paint)} tutorial={tutorial} />
          <div className={styles.aero}>
            <div className={styles.aeroReadout}>
              <span className={styles.aeroNumber}>{100 - down}%</span>
              <span className={styles.aeroLabel}>{t('carDesign.aero.lift')}</span>
            </div>
            <div className={styles.aeroReadout}>
              <span className={styles.aeroNumber}>{down}%</span>
              <span className={styles.aeroLabel}>{t('carDesign.aero.downforce')}</span>
            </div>
            <input
              type="range"
              className={styles.aeroSlider}
              min={0}
              max={100}
              value={down}
              onChange={(e) => d.setDesignTuning({ downforcePct: Number(e.target.value) })}
              aria-label={t('carDesign.aero.downforce')}
            />
          </div>
        </>
      }
      right={
        <div className={styles.appearanceRight}>
          {kit && (
            <ComponentSlotCard
              slot={kit}
              selectedOptionId={d.session.componentSelections['aero-package']}
              isOptionUnlocked={(option) => d.isUnlocked('aero-package', option)}
              onSelect={(id) => d.setComponentSelection('aero-package', id)}
            />
          )}
          <div className={styles.grow} />
          <StepMeters keys={metersOf(stepId)} stats={d.stats} />
          <ContinueButton onClick={onContinue} highlight={highlightContinue} />
        </div>
      }
    />
  )
}

/** Finish: name the car and look over all its meters. */
export function FinishStep({
  body,
  tabs,
  onContinue,
  highlightContinue,
  tutorial,
  name,
  onName,
  canContinue,
}: DesignStepProps & { name: string; onName: (name: string) => void; canContinue: boolean }) {
  const { t } = useT()
  const d = useDesign()
  if (!d.session) return null
  const all: DesignStatKey[] = ['handling', 'offroad', 'comfort', 'prestige', 'attractiveness']
  return (
    <StepFrame
      backdrop="factory"
      left={<CarSpecsPanel stats={d.stats} engineLiters={d.session.engine.displacementLiters} designFit />}
      tabs={tabs}
      costPrice={d.stats?.unitCost ?? null}
      stage={<StageCar body={body} color={paintHex(d.paint)} tutorial={tutorial} />}
      right={
        <div className={styles.appearanceRight}>
          <label className={styles.nameField}>
            {t('carDesign.modelName')}
            <input value={name} maxLength={28} onChange={(e) => onName(e.target.value)} />
          </label>
          <div className={styles.grow} />
          <StepMeters keys={all.slice(0, 3)} stats={d.stats} />
          <StepMeters keys={all.slice(3)} stats={d.stats} />
          <ContinueButton onClick={onContinue} disabled={!canContinue} highlight={highlightContinue} />
        </div>
      }
    />
  )
}

