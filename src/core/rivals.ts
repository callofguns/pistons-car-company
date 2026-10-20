import { createRng } from './prng'

export type RivalStyle = 'Budget' | 'Luxury' | 'Sports'

/** One rival car maker. Their appeal is how attractive their cars are to buyers (the same 0-1
 * scale as a model's appeal in market.ts); it drifts up over the years and jumps when they
 * launch a new model, then fades back. */
export interface RivalState {
  id: string
  name: string
  city: string
  style: RivalStyle
  baseAppeal: number
  /** Temporary extra appeal from their latest launch; fades over about two years. */
  launchBoost: number
  modelName: string
  modelYear: number
  daysToNextLaunch: number
  totalSold: number
  /** Share of all cars sold today (0-100), smoothed. */
  sharePercent: number
  rngState: number
}

export interface RivalsState {
  rivals: RivalState[]
}

/** Rivals improve a little every year, like the technology in the player's own cars. */
const APPEAL_GAIN_PER_YEAR = 0.002
const MIN_APPEAL = 0.35
const MAX_APPEAL = 0.95
const LAUNCH_BOOST_MIN = 0.05
const LAUNCH_BOOST_RANGE = 0.05
/** Daily multiplier on a launch boost - halves roughly every 15 months. */
const BOOST_FADE_PER_DAY = 0.9985

const SEEDS: { id: string; name: string; city: string; style: RivalStyle; baseAppeal: number; model: string }[] = [
  { id: 'marlowe', name: 'Marlowe Motors', city: 'Detroit', style: 'Budget', baseAppeal: 0.62, model: 'Rambler' },
  { id: 'kessler', name: 'Kessler & Voss', city: 'Stuttgart', style: 'Luxury', baseAppeal: 0.58, model: 'Imperator' },
  { id: 'corvano', name: 'Corvano', city: 'Modena', style: 'Sports', baseAppeal: 0.6, model: 'Fulmine' },
]

const MODEL_WORDS: Record<RivalStyle, string[]> = {
  Budget: ['Rambler', 'Commuter', 'Everyday', 'Pacer', 'Cadet', 'Voyager'],
  Luxury: ['Imperator', 'Regent', 'Sovereign', 'Chancellor', 'Ambassador', 'Duke'],
  Sports: ['Fulmine', 'Scorpione', 'Tempesta', 'Lampo', 'Corsa', 'Vento'],
}

export function createRivalsState(startYear: number, seed = 4242): RivalsState {
  const rng = createRng(seed)
  return {
    rivals: SEEDS.map((s, i) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      style: s.style,
      baseAppeal: s.baseAppeal,
      launchBoost: 0,
      modelName: `${s.model} ${startYear % 100}`,
      modelYear: startYear,
      daysToNextLaunch: 200 + Math.floor(rng() * 300),
      totalSold: 0,
      sharePercent: 100 / (SEEDS.length + 1),
      rngState: Math.floor(rng() * 2 ** 31) + i,
    })),
  }
}

export function rivalAppeal(rival: RivalState, year: number): number {
  const appeal = rival.baseAppeal + APPEAL_GAIN_PER_YEAR * Math.max(0, year - 1970) + rival.launchBoost
  return Math.min(MAX_APPEAL, Math.max(MIN_APPEAL, appeal))
}

/** The sum of every rival's appeal squared: how hard the competition pulls against the player's
 * own car in market.ts's captureShare. */
export function rivalStrength(rivals: RivalsState, year: number): number {
  return rivals.rivals.reduce((sum, r) => sum + rivalAppeal(r, year) ** 2, 0)
}

export interface RivalLaunch {
  rival: RivalState
  modelName: string
}

/**
 * Advances the rivals one day: launch boosts fade, new models arrive, and each rival's sales are
 * worked out from how much of the market the player did not take.
 *
 * @param marketCarsToday every maker's total sales today, the player's included
 * @param playerSoldToday how many of those the player sold
 */
export function onRivalsDayTick(rivals: RivalsState, year: number, marketCarsToday: number, playerSoldToday: number): RivalLaunch[] {
  const launches: RivalLaunch[] = []
  const squares = rivals.rivals.map((r) => rivalAppeal(r, year) ** 2)
  const total = squares.reduce((a, b) => a + b, 0)
  const rivalCars = Math.max(0, marketCarsToday - playerSoldToday)

  rivals.rivals.forEach((rival, i) => {
    rival.launchBoost *= BOOST_FADE_PER_DAY
    rival.daysToNextLaunch -= 1
    if (rival.daysToNextLaunch <= 0) {
      const rng = createRng(rival.rngState)
      const words = MODEL_WORDS[rival.style]
      rival.modelName = `${words[Math.floor(rng() * words.length)]} ${year % 100}`
      rival.modelYear = year
      rival.launchBoost = Math.min(0.12, rival.launchBoost + LAUNCH_BOOST_MIN + rng() * LAUNCH_BOOST_RANGE)
      rival.daysToNextLaunch = 450 + Math.floor(rng() * 450)
      rival.rngState = Math.floor(rng() * 2 ** 31)
      launches.push({ rival, modelName: rival.modelName })
    }

    const cars = total > 0 ? (rivalCars * squares[i]) / total : 0
    rival.totalSold += cars
    const sharePercent = marketCarsToday > 0 ? (cars / marketCarsToday) * 100 : 0
    rival.sharePercent += (sharePercent - rival.sharePercent) * 0.05
  })

  return launches
}
