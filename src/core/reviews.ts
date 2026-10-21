import type { CarModel } from './vehicles'

export type ReviewAspect = 'power' | 'reliability' | 'economy' | 'safety' | 'comfort' | 'handling' | 'value'

export const REVIEW_ASPECTS: ReviewAspect[] = ['power', 'reliability', 'economy', 'safety', 'comfort', 'handling', 'value']

/** A motoring magazine that tests every new car. Each cares about different things. */
export interface CriticDefinition {
  id: string
  name: string
  weights: Partial<Record<ReviewAspect, number>>
}

export const CRITICS: CriticDefinition[] = [
  { id: 'quarterly', name: 'Auto Quarterly', weights: { reliability: 3, safety: 3, comfort: 1.5, value: 1 } },
  { id: 'speed', name: 'Speed Monthly', weights: { power: 3, handling: 3, comfort: 0.5, reliability: 1 } },
  { id: 'thrifty', name: 'Thrifty Driver', weights: { economy: 3, value: 3, reliability: 1.5, safety: 1 } },
]

export interface CriticReview {
  critic: string
  /** 1-10, one decimal. */
  score: number
  /** What the critic talked about most, and whether it was praise or criticism. */
  aspect: ReviewAspect
  tone: 'good' | 'bad'
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** How good the car is at each aspect, 0-1, judged against what buyers expect in `year` (cars
 * get better every year, so the same car scores lower in 1995 than in 1972). */
export function aspectScores(model: CarModel, year: number): Record<ReviewAspect, number> {
  const age = Math.max(0, year - 1970)
  const { stats } = model
  const expectedPower = 85 + age * 4
  const expectedConsumption = 9 - age * 0.04
  const expectedSafety = 20 + age * 1.1
  const expectedHandling = 20 + age * 0.8
  const expectedComfort = 20 + age * 0.8
  return {
    power: clamp01(0.5 + (stats.powerHp / expectedPower - 1) * 0.6),
    reliability: clamp01((stats.reliabilityPercent - 40) / 55),
    economy: clamp01(0.5 + (1 - stats.fuelConsumptionL100Km / Math.max(3, expectedConsumption)) * 1.2),
    safety: clamp01(0.5 + (stats.designStats.safety - expectedSafety) / 90),
    handling: clamp01(0.5 + (stats.designStats.handling - expectedHandling) / 90),
    comfort: clamp01(0.5 + (stats.designStats.comfort - expectedComfort) / 90),
    // Cheap for what you get scores well: price relative to what the design is worth.
    value: clamp01(0.5 + (1 - model.salePrice / Math.max(1, stats.suggestedPrice)) * 1.5),
  }
}

/** A small repeatable wobble (+-0.4) so critics don't all agree to the decimal - from the model id,
 * so the same car always gets the same review. */
function wobble(modelId: string, criticId: string): number {
  let h = 2166136261
  for (const ch of modelId + criticId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.8
}

export function reviewModel(model: CarModel, year: number): CriticReview[] {
  const scores = aspectScores(model, year)
  return CRITICS.map((critic) => {
    let weighted = 0
    let weightSum = 0
    let aspect: ReviewAspect = 'reliability'
    let strongest = -1
    for (const key of REVIEW_ASPECTS) {
      const w = critic.weights[key] ?? 0
      if (w === 0) continue
      weighted += w * scores[key]
      weightSum += w
      const pull = w * Math.abs(scores[key] - 0.5)
      if (pull > strongest) {
        strongest = pull
        aspect = key
      }
    }
    const score = Math.round(Math.min(10, Math.max(1, 1 + 9 * (weighted / weightSum) + wobble(model.id, critic.id))) * 10) / 10
    return { critic: critic.id, score, aspect, tone: scores[aspect] >= 0.5 ? 'good' : 'bad' }
  })
}

export function averageScore(reviews: CriticReview[]): number {
  return Math.round((reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length) * 10) / 10
}

/** Buyers read the reviews: 7+ sells noticeably better, under 4 sells noticeably worse. */
export function reviewDemandMultiplier(model: CarModel): number {
  if (!model.reviews || model.reviews.length === 0) return 1
  return 1 + (averageScore(model.reviews) - 5.5) * 0.06
}

/** Reputation nudge when the reviews come out - good reviews build the company's name. */
export function reviewReputationChange(reviews: CriticReview[]): number {
  return (averageScore(reviews) - 5.5) * 0.8
}
