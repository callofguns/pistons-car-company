import { tryWithdrawRecorded, canAfford, type BankState } from './economy'
import type { LedgerState } from './ledger'
import type { GameDate } from './gameDate'
import { TechModifiers, type TechEffect } from './techModifiers'
import type { UnlockableItem } from './unlocks'

/** How many years before its due year a node can be researched as a BREAKTHROUGH. */
export const BREAKTHROUGH_MAX_YEARS_EARLY = 8
/** A breakthrough costs this much extra (money and research points) per year early - 4 years
 * early is double, 8 years early is triple. */
const BREAKTHROUGH_EXTRA_COST_PER_YEAR = 0.25

/** The six research tabs in the reference's left-hand sidebar, in display order. */
export type ResearchCategory = 'Engine' | 'Bodies' | 'Undercarriage' | 'Appearance' | 'Interior' | 'Safety'

/** One tech-tree card (e.g. "Engine material", "Dual Front Airbags"). availableYear is the year it
 * becomes a normal RESEARCH; up to BREAKTHROUGH_MAX_YEARS_EARLY years before that it can be
 * researched as a pricier BREAKTHROUGH. */
export interface ResearchNodeDefinition {
  id: string
  displayName: string
  category: ResearchCategory
  availableYear: number
  prerequisiteId: string | null
  /** Other cards that are a different choice: once one of them is started or finished, this one is closed for good. */
  excludes?: string[]
  /** Research points (the flask currency) required. */
  scienceCost: number
  moneyCost: number
  /** In-game days of progress needed once started. */
  durationDays: number
  effects: TechEffect[]
  /** The part/engine/body this research makes available in the car designer, if any. */
  unlocks?: UnlockableItem
}

/** The three button states the reference shows on a research card, plus the states before/after
 * that window. Locked = needs the previous research first; TooEarly = more than
 * BREAKTHROUGH_MAX_YEARS_EARLY years before its due year. */
export type ResearchNodeState = 'Locked' | 'Skipped' | 'TooEarly' | 'AvailableNormal' | 'AvailableBreakthrough' | 'InProgress' | 'Researched'

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
  if (node.excludes?.some((id) => runtimeOf(research, id).started || runtimeOf(research, id).researched)) return 'Skipped'
  if (node.prerequisiteId && !isResearched(research, node.prerequisiteId)) return 'Locked'
  if (currentYear >= node.availableYear) return 'AvailableNormal'
  return node.availableYear - currentYear > BREAKTHROUGH_MAX_YEARS_EARLY ? 'TooEarly' : 'AvailableBreakthrough'
}

/** 1 for normal research; more the earlier a breakthrough is. */
export function breakthroughCostMultiplier(node: ResearchNodeDefinition, currentYear: number): number {
  return 1 + Math.max(0, node.availableYear - currentYear) * BREAKTHROUGH_EXTRA_COST_PER_YEAR
}

export function currentMoneyCost(node: ResearchNodeDefinition, currentYear: number): number {
  return Math.round(node.moneyCost * breakthroughCostMultiplier(node, currentYear))
}

export function currentScienceCost(node: ResearchNodeDefinition, currentYear: number): number {
  return Math.round(node.scienceCost * breakthroughCostMultiplier(node, currentYear))
}

export function canStartResearch(
  research: ResearchState,
  node: ResearchNodeDefinition,
  bank: BankState,
  currentYear: number,
): boolean {
  const state = getNodeState(research, node, currentYear)
  if (state !== 'AvailableNormal' && state !== 'AvailableBreakthrough') return false
  return research.points >= currentScienceCost(node, currentYear) && canAfford(bank, currentMoneyCost(node, currentYear))
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
  const moneyCost = currentMoneyCost(node, currentYear)
  const scienceCost = currentScienceCost(node, currentYear)
  // Was a bare tryWithdraw() - research spend never touched the ledger, even though 'Research'
  // has always been a real TransactionCategory (ledger.ts) with an already-translated
  // Finance-screen row (BankScreen.tsx) that simply never lit up. Same bug as registerTeam's
  // (core/racing.ts) and now startCampaign's/selectBody's.
  if (!tryWithdrawRecorded(bank, ledger, moneyCost, 'Research', today)) return false

  research.points -= scienceCost

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
