import { canAfford, payMandatory, tryWithdrawRecorded, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import type { CarModel } from './vehicles'
import { isInDevelopment } from './development'

/**
 * The factory: production lines, each building one model at a time against an order the player
 * places ("build 500 more"). Lines have levels (more cars per day, more upkeep), the HQ level caps
 * how many lines fit, and unsold cars sitting in stock cost a monthly storage fee. Replaces the old
 * automatic 50,000-car production runs.
 */
export interface ProductionLine {
  id: string
  level: number
  /** The model this line builds, or null when idle. */
  modelId: string | null
  /** Cars still to build on the current order. */
  orderRemaining: number
}

export interface FactoryState {
  lines: ProductionLine[]
  nextLineNumber: number
}

export interface LineLevelDefinition {
  level: number
  carsPerDay: number
  /** Cost to upgrade a line TO this level (0 for level 1). */
  upgradeCost: number
  monthlyUpkeep: number
}

export const LINE_LEVELS: LineLevelDefinition[] = [
  { level: 1, carsPerDay: 20, upgradeCost: 0, monthlyUpkeep: 300_000 },
  { level: 2, carsPerDay: 40, upgradeCost: 3_000_000, monthlyUpkeep: 500_000 },
  { level: 3, carsPerDay: 80, upgradeCost: 8_000_000, monthlyUpkeep: 900_000 },
  { level: 4, carsPerDay: 160, upgradeCost: 20_000_000, monthlyUpkeep: 1_600_000 },
  { level: 5, carsPerDay: 320, upgradeCost: 50_000_000, monthlyUpkeep: 3_000_000 },
]

/** Cost to build an additional level-1 line. */
export const NEW_LINE_COST = 5_000_000

/** How many production lines each HQ level has room for (Garage .. Global HQ). */
const MAX_LINES_BY_HQ_LEVEL = [1, 2, 4, 6, 8]

/** Monthly storage fee per unsold car, as a fraction of its unit cost. */
export const STORAGE_FEE_PER_CAR_PER_MONTH = 0.015

export function createFactoryState(): FactoryState {
  return { lines: [{ id: 'line-1', level: 1, modelId: null, orderRemaining: 0 }], nextLineNumber: 2 }
}

export function lineLevel(level: number): LineLevelDefinition {
  return LINE_LEVELS[Math.min(LINE_LEVELS.length, Math.max(1, level)) - 1]
}

export function maxLines(hqLevel: number): number {
  return MAX_LINES_BY_HQ_LEVEL[Math.min(MAX_LINES_BY_HQ_LEVEL.length, Math.max(1, hqLevel)) - 1]
}

export function findLine(factory: FactoryState, lineId: string): ProductionLine | undefined {
  return factory.lines.find((l) => l.id === lineId)
}

/** Total cars on order across every line building this model. */
export function carsOnOrder(factory: FactoryState, modelId: string): number {
  return factory.lines.filter((l) => l.modelId === modelId).reduce((sum, l) => sum + l.orderRemaining, 0)
}

/** Points a line at a model (or null to idle it). Switching models cancels the old order. */
export function assignModel(factory: FactoryState, lineId: string, modelId: string | null): void {
  const line = findLine(factory, lineId)
  if (!line || line.modelId === modelId) return
  line.modelId = modelId
  line.orderRemaining = 0
}

/** Adds cars to a line's order. A line with no model assigned can't take an order. */
export function addOrder(factory: FactoryState, lineId: string, cars: number): boolean {
  const line = findLine(factory, lineId)
  if (!line || !line.modelId || cars <= 0) return false
  line.orderRemaining += Math.round(cars)
  return true
}

export function clearOrder(factory: FactoryState, lineId: string): void {
  const line = findLine(factory, lineId)
  if (line) line.orderRemaining = 0
}

export function canBuildLine(factory: FactoryState, hqLevel: number): boolean {
  return factory.lines.length < maxLines(hqLevel)
}

export function buildLine(factory: FactoryState, hqLevel: number, bank: BankState, ledger: LedgerState, today: GameDate): ProductionLine | null {
  if (!canBuildLine(factory, hqLevel)) return null
  if (!tryWithdrawRecorded(bank, ledger, NEW_LINE_COST, 'Factory', today)) return null
  const line: ProductionLine = { id: `line-${factory.nextLineNumber}`, level: 1, modelId: null, orderRemaining: 0 }
  factory.nextLineNumber += 1
  factory.lines.push(line)
  return line
}

export function upgradeLine(factory: FactoryState, lineId: string, bank: BankState, ledger: LedgerState, today: GameDate): boolean {
  const line = findLine(factory, lineId)
  if (!line || line.level >= LINE_LEVELS.length) return false
  const next = lineLevel(line.level + 1)
  if (!tryWithdrawRecorded(bank, ledger, next.upgradeCost, 'Factory', today)) return false
  line.level = next.level
  return true
}

export interface ProductionModifiers {
  /** Multiplies every line's cars/day (Assemblers, events like the chip shortage). */
  speedMultiplier: number
  /** Multiplies the cash cost of each car built (difficulty, Logisticians). */
  unitCostMultiplier: number
  /** Extra per-model cost factor (the company's HQ region); 1 when absent. */
  modelCostMultiplier?: (model: CarModel) => number
}

/** Builds today's cars on every line that has a released model and an open order, paying each
 * car's unit cost and throttling to what the bank can afford (never builds on credit). Returns
 * cars built per model id. */
export function onFactoryDayTick(
  factory: FactoryState,
  models: CarModel[],
  bank: BankState,
  ledger: LedgerState,
  today: GameDate,
  modifiers: ProductionModifiers,
): Map<string, number> {
  const built = new Map<string, number>()
  for (const line of factory.lines) {
    if (!line.modelId || line.orderRemaining <= 0) continue
    const model = models.find((m) => m.id === line.modelId)
    if (!model || isInDevelopment(model)) continue

    const capacity = Math.max(1, Math.floor(lineLevel(line.level).carsPerDay * modifiers.speedMultiplier))
    const unitCost = model.unitCost * modifiers.unitCostMultiplier * (modifiers.modelCostMultiplier?.(model) ?? 1)
    let units = Math.min(capacity, line.orderRemaining)
    if (!canAfford(bank, units * unitCost)) units = Math.max(0, Math.floor(bank.balance / unitCost))
    if (units <= 0) continue
    if (!tryWithdrawRecorded(bank, ledger, units * unitCost, 'Production', today)) continue

    model.inventory += units
    model.totalProduced += units
    line.orderRemaining -= units
    built.set(model.id, (built.get(model.id) ?? 0) + units)
  }
  return built
}

/** Monthly line upkeep plus the storage fee for every unsold car in stock. */
export function monthlyFactoryCosts(factory: FactoryState, models: CarModel[], costMultiplier: number): { upkeep: number; storage: number } {
  const upkeep = factory.lines.reduce((sum, l) => sum + lineLevel(l.level).monthlyUpkeep, 0) * costMultiplier
  const storage = models.reduce((sum, m) => sum + m.inventory * m.unitCost * STORAGE_FEE_PER_CAR_PER_MONTH, 0) * costMultiplier
  return { upkeep, storage }
}

export function onFactoryMonthTick(
  factory: FactoryState,
  models: CarModel[],
  bank: BankState,
  ledger: LedgerState,
  today: GameDate,
  costMultiplier: number,
): void {
  const { upkeep, storage } = monthlyFactoryCosts(factory, models, costMultiplier)
  payMandatory(bank, ledger, upkeep, 'Factory', today)
  payMandatory(bank, ledger, storage, 'Storage', today)
}

/** Puts a newly released model on the first idle line, if there is one. Returns that line. */
export function autoAssignReleasedModel(factory: FactoryState, modelId: string): ProductionLine | null {
  if (factory.lines.some((l) => l.modelId === modelId)) return null
  const idle = factory.lines.find((l) => l.modelId === null)
  if (!idle) return null
  idle.modelId = modelId
  idle.orderRemaining = 0
  return idle
}
