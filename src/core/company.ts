import { createRng, randInt } from './prng'
import type { CarModel } from './vehicles'
import type { Difficulty } from './difficulty'
import type { FounderProfile } from './foundation'

/** Company-wide numbers that don't belong to any single model. Direct port of CompanyState.cs. */
export interface CompanyState {
  companyName: string
  homeCity: string
  reputationPercent: number
  marketSharePercent: number
  populationServed: number
  autoReleasedCount: number
  totalCarsSoldAllModels: number
  lifetimeEarnings: number
  /** Consecutive days the bank balance has been below the bankruptcy threshold - see economy.ts's checkBankruptcy. */
  daysInsolvent: number
  /** Soft-fail state: once true, App.tsx shows the bankruptcy overlay instead of the normal game. */
  isBankrupt: boolean
  /** 1-based index into core/hq.ts's HQLevelDefinition ladder - staff.ts's roster capacity is
   * gated on this (see hqSlotCap), and world.ts bills the matching level's monthlyOverhead. */
  hqLevel: number
  /** Picked on the new-game screen - see core/difficulty.ts for what it changes. */
  difficulty: Difficulty
  /** Fans won by selling cars (a global-goal measure). */
  fans: number
  /** The setup choices: logo, HQ region, global goal and background. Missing in older saves. */
  founder?: FounderProfile
}

export function createCompanyState(
  companyName: string,
  homeCity: string,
  populationServed: number,
  difficulty: Difficulty = 'normal',
  founder?: FounderProfile,
): CompanyState {
  return {
    companyName,
    homeCity,
    reputationPercent: 0,
    marketSharePercent: 0,
    populationServed,
    autoReleasedCount: 0,
    totalCarsSoldAllModels: 0,
    lifetimeEarnings: 0,
    daysInsolvent: 0,
    isBankrupt: false,
    hqLevel: 1,
    difficulty,
    fans: 0,
    founder,
  }
}

/** Phrase bank for the Rumors feed. {model}/{person}/{company} tokens are substituted at generation time. */
export interface RumorTemplateSet {
  advisorNames: string[]
  modelSoldWellTemplates: string[]
  modelStruggledTemplates: string[]
  researchTemplates: string[]
}

export interface RumorState {
  recent: string[]
  rngState: number
}

export function createRumorState(seed = 777): RumorState {
  return { recent: [], rngState: seed }
}

const MAX_RUMOR_HISTORY = 30

/** Turns a units-sold event into a rumor string and pushes it into state. Purely cosmetic - never mutates any other game state. */
/** Chance a day of sales produces a rumor, and the daily sales that count as "selling well". */
const SALE_RUMOR_CHANCE = 0.08
const SELLING_WELL_UNITS_PER_DAY = 15

export function postSaleRumor(
  rumors: RumorState,
  templates: RumorTemplateSet,
  company: CompanyState,
  model: CarModel,
): void {
  const rng = createRng(rumors.rngState)
  // Called on every day a model sells - only occasionally worth a rumor.
  if (rng() > SALE_RUMOR_CHANCE) {
    rumors.rngState = Math.floor(rng() * 2 ** 31)
    return
  }
  const sellingWell = model.inventory === 0 || model.lastDayUnitsSold >= SELLING_WELL_UNITS_PER_DAY
  const pool = sellingWell ? templates.modelSoldWellTemplates : templates.modelStruggledTemplates
  post(rumors, fill(pick(pool, rng), templates, company, model, rng))
  rumors.rngState = Math.floor(rng() * 2 ** 31)
}

export function postResearchRumor(rumors: RumorState, templates: RumorTemplateSet, company: CompanyState): void {
  const rng = createRng(rumors.rngState)
  if (rng() > 0.3) {
    rumors.rngState = Math.floor(rng() * 2 ** 31)
    return // don't spam a rumor for every single progress tick
  }
  post(rumors, fill(pick(templates.researchTemplates, rng), templates, company, null, rng))
  rumors.rngState = Math.floor(rng() * 2 ** 31)
}

function pick(pool: string[], rng: () => number): string {
  if (pool.length === 0) return ''
  return pool[randInt(rng, 0, pool.length)]
}

function fill(
  template: string,
  templates: RumorTemplateSet,
  company: CompanyState,
  model: CarModel | null,
  rng: () => number,
): string {
  if (!template) return template
  const person = templates.advisorNames.length > 0 ? pick(templates.advisorNames, rng) : 'An advisor'
  return template
    .replace('{model}', model?.name ?? 'the new model')
    .replace('{person}', person)
    .replace('{company}', company.companyName)
}

function post(rumors: RumorState, text: string): void {
  if (!text.trim()) return
  // Never the same line twice in a row.
  if (rumors.recent[0] === text) return
  rumors.recent.unshift(text)
  if (rumors.recent.length > MAX_RUMOR_HISTORY) rumors.recent.length = MAX_RUMOR_HISTORY
}
