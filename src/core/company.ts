import { createRng, randInt } from './prng'
import type { CarModel } from './vehicles'

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
}

export function createCompanyState(companyName: string, homeCity: string, populationServed: number): CompanyState {
  return {
    companyName,
    homeCity,
    reputationPercent: 0,
    marketSharePercent: 4,
    populationServed,
    autoReleasedCount: 0,
    totalCarsSoldAllModels: 0,
    lifetimeEarnings: 0,
    daysInsolvent: 0,
    isBankrupt: false,
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
export function postSaleRumor(
  rumors: RumorState,
  templates: RumorTemplateSet,
  company: CompanyState,
  model: CarModel,
): void {
  const rng = createRng(rumors.rngState)
  const sellThroughGood = model.inventory === 0 || model.currentDailySalesRatePercent > 50
  const pool = sellThroughGood ? templates.modelSoldWellTemplates : templates.modelStruggledTemplates
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
  rumors.recent.unshift(text)
  if (rumors.recent.length > MAX_RUMOR_HISTORY) rumors.recent.length = MAX_RUMOR_HISTORY
}
