import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { findDesignStep, type ComponentSlot } from '../data/designSteps'
import { ENGINE_PRESETS } from '../data/enginePresets'
import { findClassificationTag } from '../data/classifications'
import { starRating, type DesignStatKey } from '../core/designStats'
import { plainCurrency } from '../core/numberFormat'
import { MeterBar } from '../components/MeterBar'
import { StatRow } from '../components/StatRow'
import { Button, Heading } from '../components/Primitives'
import { ComponentSlotCard } from '../components/design/ComponentSlotCard'
import { ClassificationPicker } from '../components/design/ClassificationPicker'
import { RatingResult } from '../components/design/RatingResult'
import { PriceSlider } from '../components/design/PriceSlider'
import styles from './screen.module.css'
import wizardStyles from './CarDesignScreen.module.css'

type WizardStepId =
  | 'Classification'
  | 'Safety'
  | 'SafetyRating'
  | 'Engine'
  | 'Transmission'
  | 'Undercarriage'
  | 'Tires'
  | 'Appearance'
  | 'Interior'
  | 'Aerodynamics'
  | 'Finish'
  | 'Pricing'

const WIZARD_STEPS: WizardStepId[] = [
  'Classification',
  'Safety',
  'SafetyRating',
  'Engine',
  'Transmission',
  'Undercarriage',
  'Tires',
  'Appearance',
  'Interior',
  'Aerodynamics',
  'Finish',
  'Pricing',
]

const STEP_META: Partial<Record<WizardStepId, { breadcrumb: string; title: string }>> = {
  Classification: { breadcrumb: 'Body Selection', title: 'Car Classification' },
  SafetyRating: { breadcrumb: 'Safety', title: 'Safety Rating' },
  Engine: { breadcrumb: 'Safety Rating', title: 'Engine' },
  Finish: { breadcrumb: 'Aerodynamics', title: 'Finish' },
  Pricing: { breadcrumb: 'Finish', title: 'Pricing' },
}

const DESIGN_STAT_LABELS: Record<DesignStatKey, string> = {
  safety: 'Safety',
  handling: 'Handling',
  offroad: 'Offroad',
  comfort: 'Comfort',
  prestige: 'Prestige',
  attractiveness: 'Attractiveness',
}

/** Steps with no meaningful Cost Price yet (Classification hasn't touched a component; SafetyRating
 * and Finish are full-bleed interstitials) - everything else shows it, matching the reference's
 * persistent COST PRICE header on every customization screen. */
const HIDES_COST_PRICE = new Set<WizardStepId>(['Classification', 'SafetyRating', 'Finish'])

function stepMeta(stepId: WizardStepId) {
  const meta = STEP_META[stepId]
  if (meta) return meta
  const step = findDesignStep(stepId)!
  return { breadcrumb: step.breadcrumb, title: step.title }
}

function safetyFeedback(stars: number): string {
  if (stars < 1.5) return 'This is dangerous. Stronger body materials and more airbags should be used.'
  if (stars < 3) return 'Decent, but buyers will expect more protection at this price point.'
  if (stars < 4) return 'Solid safety credentials - this should hold up well in reviews.'
  return 'Excellent work. This is one of the safest designs on the lot.'
}

function generateDefaultName(carClass: string | undefined): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const number = 100 + Math.floor(Math.random() * 900)
  return `${carClass ?? 'Model'} ${letter}${number}`
}

/**
 * The full car design wizard - one screen rendering step N from a fixed sequence rather than a
 * screen per step, since every reference customization screen shares the same shape (spec
 * preview, option cards, meters, Continue). Classification and Engine get bespoke content;
 * Safety/Transmission/Undercarriage/Tires/Appearance/Interior/Aerodynamics are entirely
 * data-driven from src/data/designSteps.ts.
 */
export function CarDesignScreen() {
  const show = useUiStore((s) => s.show)
  const back = useUiStore((s) => s.back)
  useGameStore((s) => s.revision)
  const session = useGameStore((s) => s.world.vehicles.currentSession)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const toggleClassificationTag = useGameStore((s) => s.toggleClassificationTag)
  const setComponentSelection = useGameStore((s) => s.setComponentSelection)
  const setEnginePreset = useGameStore((s) => s.setEnginePreset)
  const setNameAndCategory = useGameStore((s) => s.setNameAndCategory)
  const setCustomPrice = useGameStore((s) => s.setCustomPrice)
  const finalizeDesign = useGameStore((s) => s.finalizeDesign)
  const previewCurrentStats = useGameStore((s) => s.previewCurrentStats)

  const body = CATALOG.bodies.find((b) => b.id === session?.selectedBodyId)

  const [stepIndex, setStepIndex] = useState(0)
  const [name, setName] = useState(() => generateDefaultName(body?.carClass))
  const [price, setPrice] = useState<number | null>(null)

  if (!session || !body) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>No design in progress - go back and pick a body first.</span>
      </div>
    )
  }

  const stepId = WIZARD_STEPS[stepIndex]
  const meta = stepMeta(stepId)
  const stats = previewCurrentStats()
  const safetyStars = stats ? starRating(stats.designStats.safety) : 0

  const selectedTags = session.classificationTagIds
    .map((id) => findClassificationTag(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  const canContinue =
    (stepId !== 'Classification' || selectedTags.length === 2) && (stepId !== 'Finish' || name.trim().length > 0)

  const handleBack = () => {
    if (stepIndex === 0) back()
    else setStepIndex((i) => i - 1)
  }

  const handleContinue = () => {
    if (stepId === 'Pricing') {
      const tagLabel = selectedTags.map((t) => t.label.toUpperCase()).join(' + ')
      setNameAndCategory(name.trim(), tagLabel)
      setCustomPrice(price ?? stats?.suggestedPrice ?? 0)
      const modelId = finalizeDesign()
      if (modelId) show('ModelLineup', modelId)
      return
    }
    setStepIndex((i) => Math.min(WIZARD_STEPS.length - 1, i + 1))
  }

  const genericStep = findDesignStep(stepId)

  return (
    <div className={styles.screen}>
      <div className={wizardStyles.header}>
        <Button className={wizardStyles.backButton} onClick={handleBack} aria-label="Back">
          ‹
        </Button>
        <div>
          <span className={wizardStyles.breadcrumb}>{meta.breadcrumb}</span>
          <Heading className={wizardStyles.title}>{meta.title.toUpperCase()}</Heading>
        </div>
        {stats && !HIDES_COST_PRICE.has(stepId) && (
          <div className={wizardStyles.costPrice}>
            <span className={wizardStyles.costPriceLabel}>Cost Price</span>
            <span className={wizardStyles.costPriceValue}>{plainCurrency(stats.unitCost)}</span>
          </div>
        )}
      </div>

      {stepId === 'Classification' && (
        <ClassificationPicker selectedTagIds={session.classificationTagIds} onToggle={toggleClassificationTag} />
      )}

      {stepId === 'SafetyRating' && stats && (
        <RatingResult
          title="SAFETY RATING"
          value0to5={safetyStars}
          advisorName="Engineer"
          message={safetyFeedback(safetyStars)}
        />
      )}

      {stepId === 'Engine' && (
        <div className={wizardStyles.body}>
          <ComponentSlotCard
            slot={enginePresetSlot(body.engineBayCapacityLiters)}
            selectedOptionId={session.enginePresetId ?? undefined}
            currentYear={currentYear}
            onSelect={setEnginePreset}
          />
          {stats && (
            <div className={wizardStyles.specSheet}>
              <StatRow label="Power" value={`${Math.round(stats.powerHp)} HP`} />
              <StatRow label="Torque" value={`${Math.round(stats.torqueNm)} NM @${Math.round(stats.torqueRpm)} RPM`} />
              <StatRow label="Fuel consumption" value={`${stats.fuelConsumptionL100Km.toFixed(1)} L/100KM`} />
              <StatRow label="Reliability" value={`${Math.round(stats.reliabilityPercent)}%`} />
              <StatRow label="Weight" value={`${Math.round(stats.weightKg)} KG`} />
            </div>
          )}
        </div>
      )}

      {genericStep && (
        <div className={wizardStyles.body}>
          <div className={wizardStyles.slots}>
            {genericStep.slots.map((slot) => (
              <ComponentSlotCard
                key={slot.id}
                slot={slot}
                selectedOptionId={session.componentSelections[slot.id]}
                currentYear={currentYear}
                onSelect={(optionId) => setComponentSelection(slot.id, optionId)}
              />
            ))}
          </div>
          {stats && (
            <div className={wizardStyles.meters}>
              {genericStep.meters.map((key) => (
                <div key={key} className={wizardStyles.meter}>
                  <span className={wizardStyles.meterLabel}>{DESIGN_STAT_LABELS[key]}</span>
                  <MeterBar value01={stats.designStats[key] / 100} displayValue={`${Math.round(stats.designStats[key])}%`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {stepId === 'Finish' && (
        <div className={wizardStyles.body}>
          <label className={wizardStyles.nameField}>
            Model name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        </div>
      )}

      {stepId === 'Pricing' && stats && (
        <div className={wizardStyles.body}>
          <PriceSlider costPrice={stats.unitCost} price={price ?? Math.round(stats.suggestedPrice)} onChange={setPrice} />
          <div className={wizardStyles.comingSoon}>
            🚧 Sales Regions and Production Runs are coming in a future update - for now, this car goes straight on
            sale everywhere.
          </div>
        </div>
      )}

      <Button variant="primary" className={wizardStyles.continueButton} onClick={handleContinue} disabled={!canContinue}>
        {stepId === 'Pricing' ? '✓ FINISH' : '✓ CONTINUE'}
      </Button>
    </div>
  )
}

function enginePresetSlot(engineBayCapacityLiters: number): ComponentSlot {
  return {
    id: 'engine-preset',
    label: 'Engine',
    options: ENGINE_PRESETS.filter((p) => p.spec.displacementLiters <= engineBayCapacityLiters).map((p) => ({
      id: p.id,
      label: p.name,
      description: `${p.spec.displacementLiters}L ${p.spec.cylinders}-cyl ${p.spec.aspiration === 'Turbocharged' ? 'Turbo ' : ''}${p.spec.fuelType}`,
      unlockYear: p.unlockYear,
      costDelta: 0,
      weightDeltaKg: 0,
      effects: {},
    })),
  }
}
