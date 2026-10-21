import { isInDevelopment } from './development'
import { depositRecorded, payMandatory } from './economy'
import { growReach } from './market'
import { postNews } from './news'
import { createRng } from './prng'
import type { GameDate } from './gameDate'
import type { World } from './world'

/** One thing a choice does. Money amounts are in "base" dollars and are scaled up as the company
 * grows (see eventScale), so an event stings a small company and a big one alike. */
export type EventEffect =
  | { kind: 'cash'; amount: number }
  | { kind: 'reputation'; amount: number }
  | { kind: 'reach'; amount: number }
  | { kind: 'research'; amount: number }
  /** A multiplier that lasts `days` game days. */
  | { kind: 'timed'; days: number; demand?: number; speed?: number; cost?: number }

export interface EventChoice {
  id: string
  effects: EventEffect[]
  /** A gamble: with probability `chance` the `win` effects happen, otherwise the `lose` ones. */
  gamble?: { chance: number; win: EventEffect[]; lose: EventEffect[] }
}

export interface RandomEventDefinition {
  id: string
  /** Relative likelihood. */
  weight: number
  /** Only offered when this is true (e.g. a car with poor reliability for a recall). */
  condition?: (world: World) => boolean
  choices: EventChoice[]
}

const M = 1_000_000

export const RANDOM_EVENTS: RandomEventDefinition[] = [
  {
    id: 'strike',
    weight: 2,
    choices: [
      { id: 'pay', effects: [{ kind: 'cash', amount: -1 * M }, { kind: 'reputation', amount: 1 }] },
      { id: 'refuse', effects: [{ kind: 'timed', days: 45, speed: 0.5 }, { kind: 'reputation', amount: -2 }] },
    ],
  },
  {
    id: 'supplier',
    weight: 2,
    choices: [
      { id: 'accept', effects: [{ kind: 'timed', days: 150, cost: 1.1 }] },
      { id: 'switch', effects: [{ kind: 'cash', amount: -1.5 * M }] },
    ],
  },
  {
    id: 'viral',
    weight: 2,
    choices: [{ id: 'ok', effects: [{ kind: 'reach', amount: 150_000 }, { kind: 'timed', days: 30, demand: 1.3 }] }],
  },
  {
    id: 'recall',
    weight: 3,
    condition: (w) => w.vehicles.models.some((m) => !isInDevelopment(m) && m.stats.reliabilityPercent < 70 && m.totalSold > 0),
    choices: [
      { id: 'recall', effects: [{ kind: 'cash', amount: -2 * M }, { kind: 'reputation', amount: 1 }] },
      { id: 'ignore', effects: [{ kind: 'reputation', amount: -6 }, { kind: 'timed', days: 90, demand: 0.85 }] },
    ],
  },
  {
    id: 'fire',
    weight: 1,
    choices: [
      { id: 'rush', effects: [{ kind: 'cash', amount: -2 * M }] },
      { id: 'wait', effects: [{ kind: 'timed', days: 30, speed: 0.4 }] },
    ],
  },
  {
    id: 'celebrity',
    weight: 2,
    choices: [
      { id: 'gift', effects: [{ kind: 'cash', amount: -0.3 * M }, { kind: 'reach', amount: 300_000 }, { kind: 'reputation', amount: 1 }] },
      { id: 'decline', effects: [] },
    ],
  },
  {
    id: 'refund',
    weight: 1,
    choices: [{ id: 'ok', effects: [{ kind: 'cash', amount: 1 * M }] }],
  },
  {
    id: 'lawsuit',
    weight: 2,
    choices: [
      { id: 'settle', effects: [{ kind: 'cash', amount: -1 * M }] },
      {
        id: 'fight',
        effects: [],
        gamble: {
          chance: 0.5,
          win: [{ kind: 'reputation', amount: 2 }],
          lose: [{ kind: 'cash', amount: -3 * M }, { kind: 'reputation', amount: -2 }],
        },
      },
    ],
  },
  {
    id: 'engineer',
    weight: 1,
    choices: [
      { id: 'hire', effects: [{ kind: 'cash', amount: -0.5 * M }, { kind: 'research', amount: 60 }] },
      { id: 'decline', effects: [] },
    ],
  },
  {
    id: 'magazine',
    weight: 2,
    choices: [
      { id: 'sponsor', effects: [{ kind: 'cash', amount: -0.5 * M }, { kind: 'reach', amount: 200_000 }] },
      { id: 'skip', effects: [] },
    ],
  },
  {
    id: 'motorshow',
    weight: 2,
    choices: [
      { id: 'attend', effects: [{ kind: 'cash', amount: -1.5 * M }, { kind: 'reach', amount: 250_000 }, { kind: 'timed', days: 45, demand: 1.2 }] },
      { id: 'skip', effects: [] },
    ],
  },
]

export interface PendingRandomEvent {
  eventId: string
}

export interface ActiveEventEffect {
  eventId: string
  daysLeft: number
  demand: number
  speed: number
  cost: number
}

export interface RandomEventsState {
  rngState: number
  daysToNext: number
  /** The event waiting for the player's decision (time stands still until they choose). */
  pending: PendingRandomEvent | null
  active: ActiveEventEffect[]
}

/** No random events in the first stretch, so a new player can learn the basics. */
const FIRST_EVENT_DELAY_DAYS = 150
const MIN_DAYS_BETWEEN = 150
const EXTRA_DAYS_BETWEEN = 180

export function createRandomEventsState(seed = 9001): RandomEventsState {
  const rng = createRng(seed)
  return { rngState: Math.floor(rng() * 2 ** 31), daysToNext: FIRST_EVENT_DELAY_DAYS + Math.floor(rng() * 90), pending: null, active: [] }
}

/** Scales money amounts with the size of the company: 1x at the $45M start, up to 5x when rich. */
export function eventScale(world: World): number {
  return Math.min(5, Math.max(0.5, Math.sqrt(Math.max(0, world.bank.balance) / 45_000_000)))
}

export function findRandomEvent(id: string): RandomEventDefinition | undefined {
  return RANDOM_EVENTS.find((e) => e.id === id)
}

/** The multipliers every active random effect adds up to. */
export function activeRandomMultipliers(state: RandomEventsState): { demand: number; speed: number; cost: number } {
  return state.active.reduce(
    (m, a) => ({ demand: m.demand * a.demand, speed: m.speed * a.speed, cost: m.cost * a.cost }),
    { demand: 1, speed: 1, cost: 1 },
  )
}

/** Counts down timers, and now and then offers the player a new event. Call once a day. */
export function onRandomEventsDayTick(world: World, today: GameDate): void {
  const state = world.randomEvents
  state.active = state.active.filter((a) => --a.daysLeft > 0)
  if (state.pending) return
  state.daysToNext -= 1
  if (state.daysToNext > 0) return

  const rng = createRng(state.rngState)
  const eligible = RANDOM_EVENTS.filter((e) => !e.condition || e.condition(world))
  const total = eligible.reduce((sum, e) => sum + e.weight, 0)
  let pick = rng() * total
  const chosen = eligible.find((e) => (pick -= e.weight) < 0) ?? eligible[0]
  state.rngState = Math.floor(rng() * 2 ** 31)
  state.daysToNext = MIN_DAYS_BETWEEN + Math.floor(rng() * EXTRA_DAYS_BETWEEN)

  // Nothing to react to before the first car exists.
  if (world.vehicles.models.length === 0) {
    state.daysToNext = 30
    return
  }
  state.pending = { eventId: chosen.id }
  postNews(world.news, 'RandomEvent', today, { eventId: chosen.id })
}

function applyEffect(world: World, effect: EventEffect, eventId: string, today: GameDate, scale: number): void {
  switch (effect.kind) {
    case 'cash':
      if (effect.amount >= 0) depositRecorded(world.bank, world.ledger, effect.amount * scale, 'Other', today)
      else payMandatory(world.bank, world.ledger, -effect.amount * scale, 'Other', today)
      break
    case 'reputation':
      world.company.reputationPercent = Math.min(100, Math.max(0, world.company.reputationPercent + effect.amount))
      break
    case 'reach':
      growReach(world.company, effect.amount)
      break
    case 'research':
      world.research.points += effect.amount
      break
    case 'timed':
      world.randomEvents.active.push({ eventId, daysLeft: effect.days, demand: effect.demand ?? 1, speed: effect.speed ?? 1, cost: effect.cost ?? 1 })
      break
  }
}

/** Applies the player's decision and clears the pending event. Returns the outcome word, for the
 * news line ('win' / 'lose' for a gamble, '' otherwise), or null if there was nothing to resolve. */
export function resolveRandomEvent(world: World, choiceId: string, today: GameDate): 'win' | 'lose' | '' | null {
  const state = world.randomEvents
  const event = state.pending ? findRandomEvent(state.pending.eventId) : undefined
  const choice = event?.choices.find((c) => c.id === choiceId)
  if (!state.pending || !event || !choice) return null

  const scale = eventScale(world)
  let outcome: 'win' | 'lose' | '' = ''
  for (const effect of choice.effects) applyEffect(world, effect, event.id, today, scale)
  if (choice.gamble) {
    const rng = createRng(state.rngState)
    outcome = rng() < choice.gamble.chance ? 'win' : 'lose'
    state.rngState = Math.floor(rng() * 2 ** 31)
    for (const effect of outcome === 'win' ? choice.gamble.win : choice.gamble.lose) applyEffect(world, effect, event.id, today, scale)
  }
  state.pending = null
  postNews(world.news, 'RandomEventResolved', today, { eventId: event.id, choiceId, outcome })
  return outcome
}
