import { developmentDaysFor } from './development'

const RESTYLE_MIN_DEVELOPMENT_DAYS = 10
import { calculateCarSpecs, type DesignChoices } from './carSpecsCalculator'
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
  tooledBodyIds: string[]
  currentSession: ModelDesignSession | null
}

export function createVehicleState(): VehicleState {
  return { models: [], tooledBodyIds: [], currentSession: null }
}

export function resolveBody(bodies: BodyStyleDefinition[], model: CarModel): BodyStyleDefinition | undefined {
  return bodies.find((b) => b.id === model.bodyStyleId)
}

export function isBodyTooled(vehicles: VehicleState, bodyId: string): boolean {
  return vehicles.tooledBodyIds.includes(bodyId)
}

export function beginNewDesign(vehicles: VehicleState): void {
  vehicles.currentSession = createDesignSession()
}

export function beginRestyling(vehicles: VehicleState, source: CarModel): void {
  vehicles.currentSession = {
    ...createDesignSession(),
    selectedBodyId: source.bodyStyleId,
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
): boolean {
  if (!vehicles.currentSession) beginNewDesign(vehicles)
  // Newer bodies have to be researched first (see core/unlocks.ts).
  if (!isUnlocked(bodyItem(body))) return false

  if (!isBodyTooled(vehicles, body.id)) {
    // Was a bare tryWithdraw() - tooling spend never touched the ledger, even though 'Production'
    // has always been a real TransactionCategory (ledger.ts) with an already-translated
    // Finance-screen row (BankScreen.tsx) that simply never lit up for this charge. Same bug as
    // registerTeam's (core/racing.ts) and now startCampaign's/startResearch's.
    if (!tryWithdrawRecorded(bank, ledger, body.productionEquipmentCost, 'Production', today)) return false
    vehicles.tooledBodyIds.push(body.id)
  }

  const session = vehicles.currentSession!
  session.selectedBodyId = body.id

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
  if (!existingPresetStillFits) {
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
  for (const step of DESIGN_STEPS) {
    for (const slot of step.slots) {
      const optionId = session.componentSelections[slot.id]
      const option = slot.options.find((o) => o.id === optionId)
      if (option) componentOptions.push(option)
    }
  }

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
  return calculateCarSpecs(body, session.engine, tech, resolveDesignChoices(session))
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

  const stats = calculateCarSpecs(body, session.engine, tech, resolveDesignChoices(session))
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

