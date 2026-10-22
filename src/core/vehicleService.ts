import { developmentDaysFor } from './development'

const RESTYLE_MIN_DEVELOPMENT_DAYS = 10
import { DEFAULT_PAINT, DEFAULT_TUNING, tuningOption, type DesignTuning, type PaintChoice } from './carTuning'
import { BOOST_SLOT_IDS, extraBuildOption, selectionsOfBuild, specOfBuild, type EngineBuild } from './engineBuilder'
import { applyConvertible, calculateCarSpecs, CONVERTIBLE, type DesignChoices } from './carSpecsCalculator'
import { tryWithdrawRecorded, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { TechModifiers } from './techModifiers'
import {
  createDesignSession,
  type BodyStyleDefinition,
  type CarModel,
  type EngineSpec,
  type ModelDesignSession,
} from './vehicles'
import type { GameDate } from './gameDate'
import { bodyItem, engineItem, type UnlockCheck } from './unlocks'
import { DESIGN_STEPS, defaultOptionId, type ComponentOption } from '../data/designSteps'
import { ENGINE_PRESETS, findEnginePreset } from '../data/enginePresets'
import { findClassificationTag } from '../data/classifications'

/** Owns the player's model lineup and the in-progress design wizard. Direct port of VehicleService.cs. */
export interface VehicleState {
  models: CarModel[]
  /** The engines the player has built; any car design can use one. */
  engines: EngineBuild[]
  tooledBodyIds: string[]
  currentSession: ModelDesignSession | null
}

export function createVehicleState(): VehicleState {
  return { models: [], engines: [], tooledBodyIds: [], currentSession: null }
}

export function resolveBody(bodies: BodyStyleDefinition[], model: CarModel): BodyStyleDefinition | undefined {
  return bodies.find((b) => b.id === model.bodyStyleId)
}

/** What the tooling is saved under: the roof-off version needs its own equipment. */
export function toolingKey(bodyId: string, convertible = false): string {
  return convertible ? `${bodyId}+convertible` : bodyId
}

export function toolingCost(body: BodyStyleDefinition, convertible = false): number {
  return Math.round(body.productionEquipmentCost * (convertible ? CONVERTIBLE.toolingMultiplier : 1))
}

export function isBodyTooled(vehicles: VehicleState, bodyId: string, convertible = false): boolean {
  return vehicles.tooledBodyIds.includes(toolingKey(bodyId, convertible))
}

export function beginNewDesign(vehicles: VehicleState): void {
  vehicles.currentSession = createDesignSession()
}

export function beginRestyling(vehicles: VehicleState, source: CarModel): void {
  vehicles.currentSession = {
    ...createDesignSession(),
    selectedBodyId: source.bodyStyleId,
    convertible: source.convertible,
    engineBuild: source.engineBuild ?? null,
    tuning: source.tuning,
    paint: source.paint,
    salesRegions: source.salesRegions,
    engine: { ...source.engine },
    enginePresetId: source.enginePresetId,
    classificationTagIds: [...source.classificationTagIds],
    componentSelections: { ...source.componentSelections },
    categoryTag: source.categoryTag,
    sourceModelId: source.id,
  }
}

/** Picks a sensible, affordable starting engine for a new design: the everyday Standard I4 when it
 * fits the bay, otherwise the smallest-displacement preset that fits and is unlocked. (Was the
 * largest that fit, which handed every Budget car a V6 by default.) Falls back to the smallest
 * preset overall if somehow none qualify. Must exclude locked presets - ComponentSlotCard only cycles through unlocked
 * options, so defaulting to a locked one would leave the Engine step's card showing a different
 * engine than the one actually committed to the session. */
function defaultEnginePresetFor(body: BodyStyleDefinition, isUnlocked: UnlockCheck) {
  const candidates = ENGINE_PRESETS.filter(
    (p) => p.spec.displacementLiters <= body.engineBayCapacityLiters && isUnlocked(engineItem(p)),
  )
  const standard = candidates.find((p) => p.id === 'standard-i4')
  if (standard) return standard
  const sorted = [...candidates].sort((a, b) => a.spec.displacementLiters - b.spec.displacementLiters)
  if (sorted.length > 0) return sorted[0]
  return [...ENGINE_PRESETS].sort((a, b) => a.spec.displacementLiters - b.spec.displacementLiters)[0]
}

/** Selects a body for the current session, charging the one-time tooling cost the first time this
 * body is used, and seeding sane defaults (first option in every component slot, a best-fit
 * preset engine) so the rest of the wizard has valid values to preview immediately. */
export function selectBody(
  vehicles: VehicleState,
  body: BodyStyleDefinition,
  bank: BankState,
  ledger: LedgerState,
  isUnlocked: UnlockCheck,
  today: GameDate,
  convertible = false,
): boolean {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  // Newer bodies have to be researched first (see core/unlocks.ts).
  if (!isUnlocked(bodyItem(body))) return false

  if (!isBodyTooled(vehicles, body.id, convertible)) {
    // Was a bare tryWithdraw() - tooling spend never touched the ledger, even though 'Production'
    // has always been a real TransactionCategory (ledger.ts) with an already-translated
    // Finance-screen row (BankScreen.tsx) that simply never lit up for this charge. Same bug as
    // registerTeam's (core/racing.ts) and now startCampaign's/startResearch's.
    if (!tryWithdrawRecorded(bank, ledger, toolingCost(body, convertible), 'Production', today)) return false
    vehicles.tooledBodyIds.push(toolingKey(body.id, convertible))
  }

  const session = vehicles.currentSession!
  session.selectedBodyId = body.id
  session.convertible = convertible

  for (const step of DESIGN_STEPS) {
    for (const slot of step.slots) {
      if (!(slot.id in session.componentSelections)) {
        session.componentSelections[slot.id] = defaultOptionId(slot)
      }
    }
  }

  // Re-validate the committed engine preset against this body, not just "is one set" - restyling
  // into a smaller-bay body (or one where the preset has since been out-leveled by the year) can
  // leave a stale, no-longer-fitting preset committed to session.engine while the Engine step's
  // card - which filters its options by this same body - silently shows a different one instead.
  const existingPreset = session.enginePresetId ? findEnginePreset(session.enginePresetId) : undefined
  const existingPresetStillFits =
    existingPreset !== undefined &&
    existingPreset.spec.displacementLiters <= body.engineBayCapacityLiters &&
    isUnlocked(engineItem(existingPreset))
  if (!existingPresetStillFits && !session.engineBuild) {
    const preset = defaultEnginePresetFor(body, isUnlocked)
    session.enginePresetId = preset.id
    session.engine = { ...preset.spec }
  }

  return true
}

/** Class and Type are two independent single-select slots, not a shared 2-of-7 pool: picking a
 * new tag replaces whichever tag (if any) of the same category is already selected, rather than
 * being rejected once 2 tags are picked regardless of category. */
export function toggleClassificationTag(vehicles: VehicleState, tagId: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  const session = vehicles.currentSession!
  const tag = findClassificationTag(tagId)
  if (!tag) return

  if (session.classificationTagIds.includes(tagId)) {
    session.classificationTagIds = session.classificationTagIds.filter((id) => id !== tagId)
    return
  }

  const withoutSameCategory = session.classificationTagIds.filter(
    (id) => findClassificationTag(id)?.category !== tag.category,
  )
  session.classificationTagIds = [...withoutSameCategory, tagId]
}

export function setComponentSelection(vehicles: VehicleState, slotId: string, optionId: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.componentSelections[slotId] = optionId
}

export function setEnginePreset(vehicles: VehicleState, presetId: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  const preset = findEnginePreset(presetId)
  if (!preset) return
  vehicles.currentSession!.enginePresetId = preset.id
  vehicles.currentSession!.engine = { ...preset.spec }
}

/** Sets the session's engine directly, bypassing the preset carousel. Kept for tests and any
 * future custom-engine path; the wizard UI itself only calls setEnginePreset. */
export function setEngineSpec(vehicles: VehicleState, spec: EngineSpec): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.engine = spec
}

export function setNameAndCategory(vehicles: VehicleState, name: string, categoryTag: string): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.name = name
  vehicles.currentSession!.categoryTag = categoryTag
}

export function setCustomPrice(vehicles: VehicleState, price: number): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.customPrice = price
}

/** Resolves a session's stored ids (component selections + classification tags) into the
 * definitions calculateCarSpecs needs. Unrecognized/unset ids are simply skipped. */
function resolveDesignChoices(session: ModelDesignSession): DesignChoices {
  const componentOptions: ComponentOption[] = []
  const boosted = (session.componentSelections['forced-induction'] ?? 'none') !== 'none'
  for (const step of DESIGN_STEPS) {
    for (const slot of step.slots) {
      // The boost setup only matters with a turbo or supercharger fitted.
      if (BOOST_SLOT_IDS.has(slot.id) && !boosted) continue
      const optionId = session.componentSelections[slot.id]
      const option = slot.options.find((o) => o.id === optionId)
      if (option) componentOptions.push(option)
    }
  }

  // The engine builder's sliders and fuel grade.
  const extra = session.engineBuild ? extraBuildOption(session.engineBuild) : null
  if (extra) componentOptions.push(extra)
  componentOptions.push(tuningOption(session.tuning ?? DEFAULT_TUNING))

  const classificationTags = session.classificationTagIds
    .map((id) => findClassificationTag(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  return { componentOptions, classificationTags }
}

export function previewCurrentStats(
  vehicles: VehicleState,
  bodies: BodyStyleDefinition[],
  tech: TechModifiers,
) {
  const session = vehicles.currentSession
  if (!session?.selectedBodyId) return null
  const body = bodies.find((b) => b.id === session.selectedBodyId)
  if (!body) return null
  const stats = calculateCarSpecs(body, session.engine, tech, resolveDesignChoices(session))
  return session.convertible ? applyConvertible(stats) : stats
}

let modelIdCounter = 0
function nextModelId(): string {
  modelIdCounter += 1
  return `model-${Date.now().toString(36)}-${modelIdCounter}`
}

/** Completes the wizard, creating a sellable CarModel from the session in progress.
 * qualityBonusPercent comes from staff.ts's Designer aggregate - a strong design team ships a
 * more reliable car straight off the line, applied as a one-time nudge to the freshly calculated
 * reliabilityPercent (calculateCarSpecs' own ceiling is 99, see carSpecsCalculator.ts). */
export function finalizeDesign(
  vehicles: VehicleState,
  bodies: BodyStyleDefinition[],
  tech: TechModifiers,
  today: GameDate,
  qualityBonusPercent = 0,
): CarModel | null {
  const session = vehicles.currentSession
  if (!session || !session.selectedBodyId || !session.name.trim()) return null

  const body = bodies.find((b) => b.id === session.selectedBodyId)
  if (!body) return null

  const baseStats = calculateCarSpecs(body, session.engine, tech, resolveDesignChoices(session))
  const stats = session.convertible ? applyConvertible(baseStats) : baseStats
  if (qualityBonusPercent > 0) {
    stats.reliabilityPercent = Math.min(99, stats.reliabilityPercent + qualityBonusPercent)
  }
  const model: CarModel = {
    id: nextModelId(),
    name: session.name,
    bodyStyleId: body.id,
    categoryTag: session.categoryTag,
    engine: session.engine,
    enginePresetId: session.enginePresetId,
    classificationTagIds: session.classificationTagIds,
    componentSelections: session.componentSelections,
    stats,
    issueDate: today,
    unitCost: stats.unitCost,
    convertible: session.convertible ? true : undefined,
    engineBuild: session.engineBuild ?? undefined,
    tuning: session.tuning,
    paint: session.paint,
    salesRegions: session.salesRegions,
    circulation: session.circulation,
    presentation: session.presentation ? true : undefined,
    salePrice: session.customPrice ?? stats.suggestedPrice,
    inventory: 0,
    totalProduced: 0,
    totalSold: 0,
    lifetimeEarnings: 0,
    isOnSale: true,
    currentDailySalesRatePercent: 0,
    lastDayUnitsSold: 0,
    lastDayRevenue: 0,
    marketingActive: false,
    marketingDaysRemaining: 0,
    marketingEfficiencyMultiplier: 1,
  }

  // A restyle reuses the old car's engineering, so it's ready in about half the time.
  const fullDays = developmentDaysFor(stats.unitCost, session.classificationTagIds)
  const developmentDays = session.sourceModelId ? Math.max(RESTYLE_MIN_DEVELOPMENT_DAYS, Math.round(fullDays / 2)) : fullDays
  model.developmentDaysRemaining = developmentDays
  model.developmentDaysTotal = developmentDays

  vehicles.models.push(model)
  vehicles.currentSession = null
  return model
}

export function setOnSale(model: CarModel, onSale: boolean): void {
  model.isOnSale = onSale
}

export function setSalePrice(model: CarModel, price: number): void {
  model.salePrice = price
}


let engineIdCounter = 0
export function nextEngineId(): string {
  engineIdCounter += 1
  return `engine-${Date.now().toString(36)}-${engineIdCounter}`
}

/** Saves an engine in the library: replaces the one with the same id, or adds it. */
export function saveEngine(vehicles: VehicleState, build: EngineBuild): void {
  const copy: EngineBuild = { ...build, parts: { ...build.parts } }
  const index = vehicles.engines.findIndex((e) => e.id === copy.id)
  if (index >= 0) vehicles.engines[index] = copy
  else vehicles.engines.push(copy)
}

export function deleteEngine(vehicles: VehicleState, engineId: string): void {
  vehicles.engines = vehicles.engines.filter((e) => e.id !== engineId)
  if (vehicles.currentSession?.engineBuild?.id === engineId) vehicles.currentSession.engineBuild = null
}

/** Uses a library engine in the design in progress: sets its size and writes its part choices into
 * the design's selections so the car's numbers include them. */
export function applyEngineBuild(vehicles: VehicleState, build: EngineBuild): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  const session = vehicles.currentSession!
  session.engineBuild = { ...build, parts: { ...build.parts } }
  session.engine = specOfBuild(build)
  session.enginePresetId = null
  Object.assign(session.componentSelections, selectionsOfBuild(build))
}

/** Sets one of the designer's slider numbers (brake sizes, downforce). */
export function setDesignTuning(vehicles: VehicleState, patch: Partial<DesignTuning>): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  const session = vehicles.currentSession!
  session.tuning = { ...(session.tuning ?? DEFAULT_TUNING), ...patch }
}

export function setPaint(vehicles: VehicleState, paint: PaintChoice): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.paint = { ...paint }
}

export function currentPaint(vehicles: VehicleState): PaintChoice {
  return vehicles.currentSession?.paint ?? DEFAULT_PAINT
}

export function setSalesRegions(vehicles: VehicleState, regionIds: string[]): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.salesRegions = [...regionIds]
}

export function setProductionPlan(vehicles: VehicleState, circulation: number, presentation: boolean): void {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  vehicles.currentSession!.circulation = Math.max(0, Math.round(circulation))
  vehicles.currentSession!.presentation = presentation
}
