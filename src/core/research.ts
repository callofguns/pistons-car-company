import { tryWithdrawRecorded, canAfford, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import { TechModifiers, type TechEffect } from './techModifiers'

/** The six research tabs in the reference's left-hand sidebar, in display order. */
export type ResearchCategory = 'Engine' | 'Bodies' | 'Undercarriage' | 'Appearance' | 'Interior' | 'Safety'

/** One tech-tree card (e.g. "Engine material", "Crankshaft"). availableYear is the year it becomes a normal, cheap RESEARCH; researching it earlier is a BREAKTHROUGH at breakthroughCostMultiplier x cost. */
export interface ResearchNodeDefinition {
  id: string
  displayName: string
  category: ResearchCategory
  availableYear: number
  prerequisiteId: string | null
  /** Research points (the flask currency) required. */
  scienceCost: number
  moneyCost: number
  breakthroughCostMultiplier: number
  /** In-game days of progress needed once started. */
  durationDays: number
  effects: TechEffect[]
}

/** The three button states the reference shows on a research card, plus the two states before/after that window. */
export type ResearchNodeState = 'Locked' | 'AvailableNormal' | 'AvailableBreakthrough' | 'InProgress' | 'Researched'

interface NodeRuntime {
  started: boolean
  isBreakthrough: boolean
  progress01: number
  researched: boolean
}

export interface ResearchState {
  points: number
  nodeRuntime: Record<string, NodeRuntime>
  modifiers: TechModifiers
}

export function createResearchState(startingPoints: number): ResearchState {
  return { points: startingPoints, nodeRuntime: {}, modifiers: new TechModifiers() }
}

function runtimeOf(research: ResearchState, nodeId: string): NodeRuntime {
  let r = research.nodeRuntime[nodeId]
  if (!r) {
    r = { started: false, isBreakthrough: false, progress01: 0, researched: false }
    research.nodeRuntime[nodeId] = r
  }
  return r
}

export function isResearched(research: ResearchState, nodeId: string): boolean {
  return runtimeOf(research, nodeId).researched
}

export function getProgress01(research: ResearchState, nodeId: string): number {
  return runtimeOf(research, nodeId).progress01
}

export function getNodeState(
  research: ResearchState,
  node: ResearchNodeDefinition,
  currentYear: number,
): ResearchNodeState {
  const r = runtimeOf(research, node.id)
  if (r.researched) return 'Researched'
  if (r.started) return 'InProgress'
  if (node.prerequisiteId && !isResearched(research, node.prerequisiteId)) return 'Locked'
  return currentYear >= node.availableYear ? 'AvailableNormal' : 'AvailableBreakthrough'
}

export function currentMoneyCost(research: ResearchState, node: ResearchNodeDefinition, currentYear: number): number {
  const breakthrough = getNodeState(research, node, currentYear) === 'AvailableBreakthrough'
  return breakthrough ? node.moneyCost * node.breakthroughCostMultiplier : node.moneyCost
}

export function canStartResearch(
  research: ResearchState,
  node: ResearchNodeDefinition,
  bank: BankState,
  currentYear: number,
): boolean {
  const state = getNodeState(research, node, currentYear)
  if (state !== 'AvailableNormal' && state !== 'AvailableBreakthrough') return false
  return research.points >= node.scienceCost && canAfford(bank, currentMoneyCost(research, node, currentYear))
}

export function startResearch(
  research: ResearchState,
  node: ResearchNodeDefinition,
  bank: BankState,
  ledger: LedgerState,
  currentYear: number,
  today: GameDate,
): boolean {
  if (!canStartResearch(research, node, bank, currentYear)) return false

  const isBreakthrough = getNodeState(research, node, currentYear) === 'AvailableBreakthrough'
  const moneyCost = currentMoneyCost(research, node, currentYear)
  // Was a bare tryWithdraw() - research spend never touched the ledger, even though 'Research'
  // has always been a real TransactionCategory (ledger.ts) with an already-translated
  // Finance-screen row (BankScreen.tsx) that simply never lit up. Same bug as registerTeam's
  // (core/racing.ts) and now startCampaign's/selectBody's.
  if (!tryWithdrawRecorded(bank, ledger, moneyCost, 'Research', today)) return false

  research.points -= node.scienceCost

  const r = runtimeOf(research, node.id)
  r.started = true
  r.isBreakthrough = isBreakthrough
  r.progress01 = 0
  return true
}

/** Advances every in-progress node by one day and folds finished nodes' effects into
 * `research.modifiers`. Also grants the daily research-point income. Returns the ids of any nodes
 * that finished this tick (empty most days) - world.ts's News hook uses this to post
 * ResearchCompleted without needing its own before/after diff over every node every day. */
export function onResearchDayTick(research: ResearchState, allNodes: ResearchNodeDefinition[], pointsPerDay: number): string[] {
  research.points += pointsPerDay

  const justCompleted: string[] = []
  for (const node of allNodes) {
    const r = runtimeOf(research, node.id)
    if (!r.started || r.researched) continue

    r.progress01 += 1 / Math.max(1, node.durationDays)
    if (r.progress01 >= 1) {
      r.progress01 = 1
      r.researched = true
      research.modifiers.apply(node.effects)
      justCompleted.push(node.id)
    }
  }
  return justCompleted
}
