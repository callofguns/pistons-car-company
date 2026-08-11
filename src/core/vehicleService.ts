import { calculateCarSpecs } from './carSpecsCalculator'
import { tryWithdraw, type BankState } from './economy'
import type { TechModifiers } from './techModifiers'
import {
  createDesignSession,
  type BodyStyleDefinition,
  type CarModel,
  type EngineSpec,
  type ModelDesignSession,
} from './vehicles'
import type { GameDate } from './gameDate'

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
    categoryTag: source.categoryTag,
    sourceModelId: source.id,
  }
}

/** Selects a body for the current session, charging the one-time tooling cost the first time this body is used. */
export function selectBody(vehicles: VehicleState, body: BodyStyleDefinition, bank: BankState): boolean {
  if (!vehicles.currentSession) beginNewDesign(vehicles)

  if (!isBodyTooled(vehicles, body.id)) {
    if (!tryWithdraw(bank, body.productionEquipmentCost)) return false
    vehicles.tooledBodyIds.push(body.id)
  }

  vehicles.currentSession!.selectedBodyId = body.id
  return true
}

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

export function previewCurrentStats(
  vehicles: VehicleState,
  bodies: BodyStyleDefinition[],
  tech: TechModifiers,
) {
  const session = vehicles.currentSession
  if (!session?.selectedBodyId) return null
  const body = bodies.find((b) => b.id === session.selectedBodyId)
  if (!body) return null
  return calculateCarSpecs(body, session.engine, tech)
}

let modelIdCounter = 0
function nextModelId(): string {
  modelIdCounter += 1
  return `model-${Date.now().toString(36)}-${modelIdCounter}`
}

/** Completes the wizard, creating a sellable CarModel from the session in progress. */
export function finalizeDesign(
  vehicles: VehicleState,
  bodies: BodyStyleDefinition[],
  tech: TechModifiers,
  today: GameDate,
  maxProductionBatch: number,
): CarModel | null {
  const session = vehicles.currentSession
  if (!session || !session.selectedBodyId || !session.name.trim()) return null

  const body = bodies.find((b) => b.id === session.selectedBodyId)
  if (!body) return null

  const stats = calculateCarSpecs(body, session.engine, tech)
  const model: CarModel = {
    id: nextModelId(),
    name: session.name,
    bodyStyleId: body.id,
    categoryTag: session.categoryTag,
    engine: session.engine,
    stats,
    issueDate: today,
    unitCost: stats.unitCost,
    salePrice: session.customPrice ?? stats.suggestedPrice,
    plannedProductionRun: maxProductionBatch,
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

export function extendProductionRun(model: CarModel, additionalUnits: number): void {
  if (additionalUnits <= 0) return
  model.plannedProductionRun += additionalUnits
}
