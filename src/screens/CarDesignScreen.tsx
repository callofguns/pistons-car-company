import { useEffect, useState } from 'react'
import { Banknote } from 'lucide-react'
import { BARE_METAL, CarArt } from '../art/CarArt'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep, useTutorialStore } from '../store/useTutorialStore'
import { CATALOG } from '../data/catalog'
import { FactoryBackdrop } from '../art/FactoryBackdrop'
import { findDesignStep } from '../data/designSteps'
import { findClassificationTag } from '../data/classifications'
import { starRating } from '../core/designStats'
import { plainCurrency } from '../core/numberFormat'
import { toolingCost } from '../core/vehicleService'
import { buildLiters } from '../core/engineBuilder'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { CAR_CLASS_KEY } from '../i18n/vehicles'
import { translateDesignStep } from '../i18n/designSteps'
import { MeterBar } from '../components/MeterBar'
import { DEFAULT_PAINT, paintHex } from '../core/carTuning'
import { developmentDaysFor } from '../core/development'
import { Button } from '../components/Primitives'
import { ComponentSlotCard } from '../components/design/ComponentSlotCard'
import { partItem, unlockedByResearch } from '../core/unlocks'
import { ClassificationBoard } from '../components/design/ClassificationBoard'
import { OptionStrip } from '../components/design/OptionStrip'
import { EngineStepView, type BuilderHud } from '../components/design/EngineStepView'
import { SafetyRatingScene } from '../components/design/SafetyRatingScene'
import { PriceScreen } from '../components/design/PriceScreen'
import { ProductionScreen } from '../components/design/ProductionScreen'
import { SalesRegionsView } from '../components/design/SalesRegionsView'
import { WizardTabs } from '../components/design/WizardTabs'
import { AeroStep, AppearanceStep, FinishStep, InteriorStep, PartsStep } from '../components/design/DesignSteps'
import { TutorialCard } from '../components/TutorialCard'
import styles from './screen.module.css'
import layout from './showroom.module.css'
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
  | 'SalesRegions'
  | 'Pricing'
  | 'Production'

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
  'SalesRegions',
  'Pricing',
  'Production',
]

/** Overrides for steps with bespoke content (Classification/SafetyRating/Engine/Finish/Pricing).
 * The remaining steps are entirely data-driven, so their breadcrumb/title come straight from
 * data/designSteps.ts instead (migrated to message keys separately, in PR 3). */
const STEP_META_KEYS: Partial<Record<WizardStepId, { breadcrumbKey: MessageKey; titleKey: MessageKey }>> = {
  Classification: { breadcrumbKey: 'carDesign.step.classification.breadcrumb', titleKey: 'carDesign.step.classification.title' },
  SafetyRating: { breadcrumbKey: 'carDesign.step.safetyRating.breadcrumb', titleKey: 'carDesign.step.safetyRating.title' },
  Engine: { breadcrumbKey: 'carDesign.step.engine.breadcrumb', titleKey: 'carDesign.step.engine.title' },
  Finish: { breadcrumbKey: 'carDesign.step.finish.breadcrumb', titleKey: 'carDesign.step.finish.title' },
  SalesRegions: { breadcrumbKey: 'carDesign.step.salesRegions.breadcrumb', titleKey: 'carDesign.step.salesRegions.title' },
  Pricing: { breadcrumbKey: 'carDesign.step.pricing.breadcrumb', titleKey: 'carDesign.step.pricing.title' },
  Production: { breadcrumbKey: 'carDesign.step.production.breadcrumb', titleKey: 'carDesign.step.production.title' },
}

function stepMeta(stepId: WizardStepId, t: ReturnType<typeof useT>['t']) {
  const meta = STEP_META_KEYS[stepId]
  if (meta) return { breadcrumb: t(meta.breadcrumbKey), title: t(meta.titleKey) }
  const step = translateDesignStep(findDesignStep(stepId)!, t)
  return { breadcrumb: step.breadcrumb, title: step.title }
}

/** What the engineer says: the first thing that would raise the score, or a general verdict. */
function safetyAdvice(
  stars: number,
  selections: Record<string, string>,
  t: ReturnType<typeof useT>['t'],
): string {
  if (stars < 3.5) {
    const slotIsBasic = (slotId: string) => {
      const slot = findDesignStep('Safety')?.slots.find((s) => s.id === slotId)
      return !slot || selections[slotId] === slot.options[0].id
    }
    if (slotIsBasic('body-material')) return t('carDesign.safetyAdvice.material')
    if (slotIsBasic('airbags')) return t('carDesign.safetyAdvice.airbags')
    if (slotIsBasic('passive-safety')) return t('carDesign.safetyAdvice.passive')
  }
  return safetyFeedback(stars, t)
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
  const research = useGameStore((s) => s.world.research)
  const toggleClassificationTag = useGameStore((s) => s.toggleClassificationTag)
  const setComponentSelection = useGameStore((s) => s.setComponentSelection)
  const setNameAndCategory = useGameStore((s) => s.setNameAndCategory)
  const setCustomPrice = useGameStore((s) => s.setCustomPrice)
  const finalizeDesign = useGameStore((s) => s.finalizeDesign)
  const setSalesRegions = useGameStore((s) => s.setSalesRegions)
  const setProductionPlan = useGameStore((s) => s.setProductionPlan)
  const company = useGameStore((s) => s.world.company)
  const bank = useGameStore((s) => s.world.bank)
  const today = useGameStore((s) => s.world.time.currentDate)
  const catalog = useGameStore((s) => s.catalog)
  const previewCurrentStats = useGameStore((s) => s.previewCurrentStats)
  const { t, fmt } = useT()

  const body = CATALOG.bodies.find((b) => b.id === session?.selectedBodyId)
  const isUnlocked = unlockedByResearch(research)

  const [stepIndex, setStepIndex] = useState(0)
  const [name, setName] = useState(() => generateDefaultName(body?.carClass, t))
  const [price, setPrice] = useState<number | null>(null)
  const [circulation, setCirculation] = useState(1000)
  const [autoProduction, setAutoProduction] = useState(true)
  const [presentation, setPresentation] = useState(false)
  const [launchError, setLaunchError] = useState(false)
  // Set by the engine builder while it is open, so the top bar follows its sections.
  const [builderHud, setBuilderHud] = useState<BuilderHud | null>(null)

  // stepId is local state, so TutorialOverlay (rendered at the App level) can't see it directly -
  // report it into useTutorialStore instead. Cleared on unmount so leaving this screen doesn't
  // leave a stale wizard sub-step matching a step that no longer applies.
  const reportWizardStep = useTutorialStore((s) => s.reportWizardStep)
  useEffect(() => {
    reportWizardStep(session ? WIZARD_STEPS[stepIndex] : null)
    return () => reportWizardStep(null)
  }, [session, stepIndex, reportWizardStep])

  const tutorialStep = useActiveTutorialStep()

  // The top bar shows this step's breadcrumb + title, and its back arrow steps back through the
  // wizard (leaving for Body Selection only from the first step).
  const setHudOverride = useUiStore((s) => s.setHudOverride)
  useEffect(() => {
    const stepMetaNow = stepMeta(WIZARD_STEPS[stepIndex], t)
    setHudOverride(
      builderHud ?? {
        menuLabel: stepMetaNow.breadcrumb,
        title: stepMetaNow.title,
        onBack: () => (stepIndex === 0 ? back() : setStepIndex(stepIndex - 1)),
      },
    )
  }, [stepIndex, back, setHudOverride, t, builderHud])
  useEffect(() => () => setHudOverride(null), [setHudOverride])

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

  const engineFits = !session.engineBuild || buildLiters(session.engineBuild) <= body.engineBayCapacityLiters + 0.001
  const engineChosen = session.engineBuild != null || session.sourceModelId !== null
  const canContinue =
    (stepId !== 'Classification' || selectedTags.length === 2) &&
    (stepId !== 'Engine' || (engineChosen && engineFits)) &&
    (stepId !== 'Finish' || name.trim().length > 0)

  const handleBack = () => {
    if (stepIndex === 0) back()
    else setStepIndex((i) => i - 1)
  }

  const handleContinue = (finalCirculation?: number | unknown) => {
    if (stepId === 'Production') {
      // Legacy field (see core/vehicles.ts's @deprecated doc comment on CarModel.categoryTag) -
      // still written in English for save round-tripping, but no display site reads it anymore;
      // every display derives the tag live via i18n/vehicles.ts's formatCategoryTag() instead.
      const tagLabel = selectedTags.map((tag) => tag.label.toUpperCase()).join(' + ')
      setNameAndCategory(name.trim(), tagLabel)
      setCustomPrice(price ?? Math.round(stats?.suggestedPrice ?? 0))
      setProductionPlan(typeof finalCirculation === 'number' ? finalCirculation : circulation, presentation)
      const modelId = finalizeDesign()
      if (modelId) {
        setLaunchError(false)
        // Drop the Body Selection / wizard screens from the back-stack, so Back on the new model's
        // page returns to the Office instead of re-entering a design session that no longer exists.
        goHome('OfficeHub')
        show('ModelLineup', modelId)
      } else {
        setLaunchError(true)
      }
      return
    }
    setStepIndex((i) => Math.min(WIZARD_STEPS.length - 1, i + 1))
  }

  const rawGenericStep = findDesignStep(stepId)
  const genericStep = rawGenericStep ? translateDesignStep(rawGenericStep, t) : undefined

  if (stepId === 'Classification') {
    return (
      <div className={wizardStyles.fullPage}>
        <ClassificationBoard selectedTagIds={session.classificationTagIds} onToggle={toggleClassificationTag} />
        <Button
          variant="primary"
          data-tutorial-target="wizard-continue"
          className={`${wizardStyles.floatingContinue} ${canContinue && tutorialStep?.step.targetId === 'wizard-continue' ? 'tutorial-target-highlight' : ''}`}
          onClick={handleContinue}
          disabled={!canContinue}
        >
          {t('common.continue')}
        </Button>
        {tutorialStep && (
          <div className={wizardStyles.tutorialCorner}>
            <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />
          </div>
        )}
      </div>
    )
  }

  if (stepId === 'SafetyRating' && stats) {
    return (
      <SafetyRatingScene
        bodyId={body.id}
        convertible={session.convertible}
        stars={safetyStars}
        advice={safetyAdvice(safetyStars, session.componentSelections, t)}
        onContinue={handleContinue}
        tutorial={tutorialStep ? <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} /> : undefined}
      />
    )
  }

  if (stepId === 'Safety' && genericStep && genericStep.slots.length > 0) {
    const [mainSlot, ...otherSlots] = genericStep.slots
    const weight = stats?.weightKg ?? body.baseWeightKg
    return (
      <div className={wizardStyles.safetyPage}>
        <FactoryBackdrop className={layout.backdrop} />

        <div className={wizardStyles.safetyHeader}>
          <div>
            <span className={wizardStyles.costPriceLabel}>{t('carDesign.costPrice')}</span>
            <span className={wizardStyles.costPriceValue}>
              <Banknote size={15} />
              {plainCurrency(stats?.unitCost ?? 0)}
            </span>
          </div>
          <div>
            <span className={wizardStyles.costPriceLabel}>{t('carDesign.production')}</span>
            <span className={wizardStyles.costPriceValue}>
              <Banknote size={15} />
              {fmt.money(toolingCost(body, session.convertible))}
            </span>
          </div>
        </div>

        <div className={wizardStyles.safetyStage}>
          <CarArt bodyId={body.id} color={BARE_METAL} variant="bare" convertible={session.convertible} className={wizardStyles.car} />
          {tutorialStep && (
            <div className={wizardStyles.tutorial}>
              <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />
            </div>
          )}
        </div>

        <div className={wizardStyles.safetyStrip}>
          <OptionStrip
            slot={mainSlot}
            selectedOptionId={session.componentSelections[mainSlot.id]}
            isOptionUnlocked={(option) => isUnlocked(partItem(mainSlot.id, option))}
            onSelect={(optionId) => setComponentSelection(mainSlot.id, optionId)}
          />
        </div>

        <aside className={wizardStyles.safetySide}>
          <div className={layout.partsHeader}>
            <span className={wizardStyles.safetyTitle}>{meta.title}</span>
          </div>
          <div className={`${layout.sideList} ${wizardStyles.safetyList}`}>
            {otherSlots.map((slot) => (
              <ComponentSlotCard
                key={slot.id}
                slot={slot}
                selectedOptionId={session.componentSelections[slot.id]}
                isOptionUnlocked={(option) => isUnlocked(partItem(slot.id, option))}
                onSelect={(optionId) => setComponentSelection(slot.id, optionId)}
              />
            ))}
          </div>
          <div className={wizardStyles.safetyMeters}>
            <div className={wizardStyles.safetyMeter}>
              <span>{t('carDesign.safetyMeter')}</span>
              <MeterBar value01={(stats?.designStats.safety ?? 0) / 100} displayValue={t('carDesign.meterPercent', { value: Math.round(stats?.designStats.safety ?? 0) })} />
            </div>
            <div className={wizardStyles.safetyMeter}>
              <span>{t('carDesign.baseBodyWeight')}</span>
              <MeterBar value01={(weight - 800) / 1600} displayValue={`${Math.round(weight)}`} />
            </div>
          </div>
          <Button
            variant="primary"
            data-tutorial-target="wizard-continue"
            className={`${wizardStyles.safetyContinue} ${tutorialStep?.step.targetId === 'wizard-continue' ? 'tutorial-target-highlight' : ''}`}
            onClick={handleContinue}
          >
            {t('common.continue')}
          </Button>
        </aside>
      </div>
    )
  }

  const tabs = (
    <WizardTabs
      titles={WIZARD_STEPS.map((id) => stepMeta(id, t).title)}
      index={stepIndex}
      maxIndex={canContinue ? stepIndex + 1 : stepIndex}
      onJump={setStepIndex}
    />
  )
  const highlight = canContinue && tutorialStep?.step.targetId === 'wizard-continue'
  const tutorialNode = tutorialStep ? <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} /> : undefined
  const stepProps = { stepId, body, tabs, onContinue: handleContinue, highlightContinue: highlight, tutorial: tutorialNode }

  if (stepId === 'Engine') {
    return (
      <EngineStepView
        bayLiters={body.engineBayCapacityLiters}
        tabs={tabs}
        canContinue={canContinue}
        onContinue={handleContinue}
        onBuilderHud={setBuilderHud}
        tutorial={tutorialNode}
      />
    )
  }

  if (stepId === 'Transmission' || stepId === 'Undercarriage' || stepId === 'Tires') return <PartsStep key={stepId} {...stepProps} />
  if (stepId === 'Interior') return <InteriorStep key={stepId} {...stepProps} />
  if (stepId === 'Appearance') return <AppearanceStep key={stepId} {...stepProps} />
  if (stepId === 'Aerodynamics') return <AeroStep key={stepId} {...stepProps} />
  if (stepId === 'Finish') return <FinishStep key={stepId} {...stepProps} name={name} onName={setName} canContinue={canContinue} />

  if (stepId === 'SalesRegions') {
    return (
      <SalesRegionsView
        chosen={session.salesRegions ?? []}
        onChange={setSalesRegions}
        emissionsGKm={stats?.emissionsGKm ?? 0}
        year={today.year}
        carClass={body.carClass}
        onContinue={handleContinue}
        tutorial={tutorialNode}
      />
    )
  }

  if (stepId === 'Pricing') {
    const marketPrice = company.hqLevel >= 2 ? Math.round(catalog.marketSegments.reduce((sum, seg) => sum + seg.populationShare * seg.expectedPrice, 0)) : null
    return (
      <PriceScreen
        costPrice={stats?.unitCost ?? 0}
        price={price ?? Math.round(stats?.suggestedPrice ?? 0)}
        onPrice={setPrice}
        marketPrice={marketPrice}
        onConfirm={() => {
          setCustomPrice(price ?? Math.round(stats?.suggestedPrice ?? 0))
          handleContinue()
        }}
        onBack={handleBack}
        tutorial={tutorialNode}
      />
    )
  }

  // Production
  const unitCost = stats?.unitCost ?? 0
  const maxCirculation = unitCost > 0 ? Math.min(100_000, Math.floor(bank.balance / unitCost)) : 0
  const autoCirculation = Math.max(100, Math.round(Math.min(maxCirculation * 0.3, 5000) / 50) * 50)
  const shownCirculation = autoProduction ? autoCirculation : Math.min(circulation, maxCirculation)
  const fullDays = developmentDaysFor(unitCost, session.classificationTagIds)
  const developmentDays = session.sourceModelId ? Math.max(10, Math.round(fullDays / 2)) : fullDays
  return (
    <ProductionScreen
      name={name.trim()}
      bodyId={body.id}
      color={paintHex(session.paint ?? DEFAULT_PAINT)}
      convertible={session.convertible}
      circulation={shownCirculation}
      maxCirculation={maxCirculation}
      onCirculation={setCirculation}
      auto={autoProduction}
      onAuto={(on) => {
        if (!on) setCirculation(shownCirculation)
        setAutoProduction(on)
      }}
      presentation={presentation}
      onPresentation={setPresentation}
      equipmentCost={toolingCost(body, session.convertible)}
      unitCost={unitCost}
      developmentDays={developmentDays}
      error={launchError}
      onStart={() => handleContinue(shownCirculation)}
      tutorial={tutorialNode}
    />
  )
}
