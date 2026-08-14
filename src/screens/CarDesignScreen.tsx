import { useEffect, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep, useTutorialStore } from '../store/useTutorialStore'
import { CATALOG } from '../data/catalog'
import { findDesignStep, type ComponentSlot } from '../data/designSteps'
import { ENGINE_PRESETS } from '../data/enginePresets'
import { findClassificationTag } from '../data/classifications'
import { starRating, type DesignStatKey } from '../core/designStats'
import { plainCurrency } from '../core/numberFormat'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { CAR_CLASS_KEY } from '../i18n/vehicles'
import { MeterBar } from '../components/MeterBar'
import { StatRow } from '../components/StatRow'
import { Button, Heading } from '../components/Primitives'
import { ComponentSlotCard } from '../components/design/ComponentSlotCard'
import { ClassificationPicker } from '../components/design/ClassificationPicker'
import { RatingResult } from '../components/design/RatingResult'
import { PriceSlider } from '../components/design/PriceSlider'
import { TutorialCard } from '../components/TutorialCard'
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

/** Overrides for steps with bespoke content (Classification/SafetyRating/Engine/Finish/Pricing).
 * The remaining steps are entirely data-driven, so their breadcrumb/title come straight from
 * data/designSteps.ts instead (migrated to message keys separately, in PR 3). */
const STEP_META_KEYS: Partial<Record<WizardStepId, { breadcrumbKey: MessageKey; titleKey: MessageKey }>> = {
  Classification: { breadcrumbKey: 'carDesign.step.classification.breadcrumb', titleKey: 'carDesign.step.classification.title' },
  SafetyRating: { breadcrumbKey: 'carDesign.step.safetyRating.breadcrumb', titleKey: 'carDesign.step.safetyRating.title' },
  Engine: { breadcrumbKey: 'carDesign.step.engine.breadcrumb', titleKey: 'carDesign.step.engine.title' },
  Finish: { breadcrumbKey: 'carDesign.step.finish.breadcrumb', titleKey: 'carDesign.step.finish.title' },
  Pricing: { breadcrumbKey: 'carDesign.step.pricing.breadcrumb', titleKey: 'carDesign.step.pricing.title' },
}

const DESIGN_STAT_LABEL_KEY: Record<DesignStatKey, MessageKey> = {
  safety: 'data.designStat.safety',
  handling: 'data.designStat.handling',
  offroad: 'data.designStat.offroad',
  comfort: 'data.designStat.comfort',
  prestige: 'data.designStat.prestige',
  attractiveness: 'data.designStat.attractiveness',
}

/** Steps with no meaningful Cost Price header (Classification hasn't touched a component;
 * SafetyRating and Finish are full-bleed interstitials; Pricing already shows Cost Price as part
 * of its own PriceSlider, so repeating it in the header would be redundant) - everything else
 * shows it, matching the reference's persistent COST PRICE header on every customization screen. */
const HIDES_COST_PRICE = new Set<WizardStepId>(['Classification', 'SafetyRating', 'Finish', 'Pricing'])

function stepMeta(stepId: WizardStepId, t: ReturnType<typeof useT>['t']) {
  const meta = STEP_META_KEYS[stepId]
  if (meta) return { breadcrumb: t(meta.breadcrumbKey), title: t(meta.titleKey) }
  const step = findDesignStep(stepId)!
  return { breadcrumb: step.breadcrumb, title: step.title }
}

function safetyFeedback(stars: number, t: ReturnType<typeof useT>['t']): string {
  if (stars < 1.5) return t('carDesign.safetyFeedback.dangerous')
  if (stars < 3) return t('carDesign.safetyFeedback.decent')
  if (stars < 4) return t('carDesign.safetyFeedback.solid')
  return t('carDesign.safetyFeedback.excellent')
}

/** Generates the suggestion pre-filled into the Finish step's editable name field - not fixed
 * data. What gets persisted (CarModel.name) is whatever the player actually accepts, which is why
 * this only needs to look right at generation time and is never retro-translated afterward - see
 * core/vehicles.ts's doc comment on CarModel.name for the full reasoning. */
function generateDefaultName(carClass: string | undefined, t: ReturnType<typeof useT>['t']): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const number = 100 + Math.floor(Math.random() * 900)
  const classLabel = carClass && CAR_CLASS_KEY[carClass] ? t(CAR_CLASS_KEY[carClass]) : t('carDesign.defaultNameFallback')
  return t('carDesign.defaultNamePattern', { carClass: classLabel, suffix: `${letter}${number}` })
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
  const goHome = useUiStore((s) => s.goHome)
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
  const { t } = useT()

  const body = CATALOG.bodies.find((b) => b.id === session?.selectedBodyId)

  const [stepIndex, setStepIndex] = useState(0)
  const [name, setName] = useState(() => generateDefaultName(body?.carClass, t))
  const [price, setPrice] = useState<number | null>(null)

  // stepId is local state, so TutorialOverlay (rendered at the App level) can't see it directly -
  // report it into useTutorialStore instead. Cleared on unmount so leaving this screen doesn't
  // leave a stale wizard sub-step matching a step that no longer applies.
  const reportWizardStep = useTutorialStore((s) => s.reportWizardStep)
  useEffect(() => {
    reportWizardStep(session ? WIZARD_STEPS[stepIndex] : null)
    return () => reportWizardStep(null)
  }, [session, stepIndex, reportWizardStep])

  const tutorialStep = useActiveTutorialStep()

  if (!session || !body) {
    // Shouldn't normally be reachable (this screen only shows once selectBody has set up a
    // session) but stray navigation - e.g. a back-stack entry left over from a prior design that
    // already finished - could still land here with nothing to show. A dead end with no way
    // forward isn't acceptable, so this offers a real way out rather than just inert text.
    return (
      <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`}>
        <span className={styles.empty}>{t('carDesign.noDesignInProgress')}</span>
        <Button variant="primary" style={{ width: '100%' }} onClick={() => goHome('OfficeHub')}>
          {t('carDesign.backToOffice')}
        </Button>
      </div>
    )
  }

  const stepId = WIZARD_STEPS[stepIndex]
  const meta = stepMeta(stepId, t)
  const stats = previewCurrentStats()
  const safetyStars = stats ? starRating(stats.designStats.safety) : 0

  const selectedTags = session.classificationTagIds
    .map((id) => findClassificationTag(id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined)

  const canContinue =
    (stepId !== 'Classification' || selectedTags.length === 2) && (stepId !== 'Finish' || name.trim().length > 0)

  const handleBack = () => {
    if (stepIndex === 0) back()
    else setStepIndex((i) => i - 1)
  }

  const handleContinue = () => {
    if (stepId === 'Pricing') {
      // Legacy field (see core/vehicles.ts's @deprecated doc comment on CarModel.categoryTag) -
      // still written in English for save round-tripping, but no display site reads it anymore;
      // every display derives the tag live via i18n/vehicles.ts's formatCategoryTag() instead.
      const tagLabel = selectedTags.map((tag) => tag.label.toUpperCase()).join(' + ')
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
        <Button className={wizardStyles.backButton} onClick={handleBack} aria-label={t('common.back')}>
          ‹
        </Button>
        <div>
          <span className={wizardStyles.breadcrumb}>{meta.breadcrumb}</span>
          <Heading className={wizardStyles.title}>{meta.title}</Heading>
        </div>
        {stats && !HIDES_COST_PRICE.has(stepId) && (
          <div className={wizardStyles.costPrice}>
            <span className={wizardStyles.costPriceLabel}>{t('carDesign.costPrice')}</span>
            <span className={wizardStyles.costPriceValue}>{plainCurrency(stats.unitCost)}</span>
          </div>
        )}
      </div>

      {tutorialStep && <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />}

      {stepId === 'Classification' && (
        <div className={wizardStyles.body}>
          <ClassificationPicker selectedTagIds={session.classificationTagIds} onToggle={toggleClassificationTag} />
        </div>
      )}

      {stepId === 'SafetyRating' && stats && (
        <RatingResult
          title={t('carDesign.safetyRatingTitle')}
          value0to5={safetyStars}
          advisorName={t('carDesign.engineerAdvisor')}
          message={safetyFeedback(safetyStars, t)}
        />
      )}

      {stepId === 'Engine' && (
        <div className={wizardStyles.body}>
          <ComponentSlotCard
            slot={enginePresetSlot(body.engineBayCapacityLiters, t('carDesign.step.engine.title'))}
            selectedOptionId={session.enginePresetId ?? undefined}
            currentYear={currentYear}
            onSelect={setEnginePreset}
          />
          {stats && (
            <div className={wizardStyles.specSheet}>
              <StatRow label={t('modelLineup.labelPower')} value={t('modelLineup.power', { value: Math.round(stats.powerHp) })} />
              <StatRow
                label={t('modelLineup.labelTorque')}
                value={t('modelLineup.torque', { value: Math.round(stats.torqueNm), rpm: Math.round(stats.torqueRpm) })}
              />
              <StatRow
                label={t('modelLineup.labelFuelConsumption')}
                value={t('modelLineup.fuelConsumption', { value: stats.fuelConsumptionL100Km.toFixed(1) })}
              />
              <StatRow
                label={t('modelLineup.labelReliability')}
                value={t('carDesign.reliability', { value: Math.round(stats.reliabilityPercent) })}
              />
              <StatRow label={t('modelLineup.labelWeight')} value={t('modelLineup.weight', { value: Math.round(stats.weightKg) })} />
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
                  <span className={wizardStyles.meterLabel}>{t(DESIGN_STAT_LABEL_KEY[key])}</span>
                  <MeterBar
                    value01={stats.designStats[key] / 100}
                    displayValue={t('carDesign.meterPercent', { value: Math.round(stats.designStats[key]) })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {stepId === 'Finish' && (
        <div className={wizardStyles.body}>
          <label className={wizardStyles.nameField}>
            {t('carDesign.modelName')}
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        </div>
      )}

      {stepId === 'Pricing' && stats && (
        <div className={wizardStyles.body}>
          <PriceSlider costPrice={stats.unitCost} price={price ?? Math.round(stats.suggestedPrice)} onChange={setPrice} />
          <div className={wizardStyles.comingSoon}>{t('carDesign.comingSoon')}</div>
        </div>
      )}

      <Button
        variant="primary"
        data-tutorial-target="wizard-continue"
        className={`${wizardStyles.continueButton} ${
          canContinue && tutorialStep?.step.targetId === 'wizard-continue' ? 'tutorial-target-highlight' : ''
        }`}
        onClick={handleContinue}
        disabled={!canContinue}
      >
        {stepId === 'Pricing' ? t('carDesign.finish') : t('common.continue')}
      </Button>
    </div>
  )
}

function enginePresetSlot(engineBayCapacityLiters: number, label: string): ComponentSlot {
  return {
    id: 'engine-preset',
    label,
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
