import type { ComponentOption } from '../data/designSteps'

/** Numbers the car designer sets with sliders instead of picking a part. */
export interface DesignTuning {
  /** Brake disc sizes in millimetres. */
  brakeFrontMm: number
  brakeRearMm: number
  /** 0-100: how much of the air pressure pushes the car down (the rest lifts it). */
  downforcePct: number
}

export const DEFAULT_TUNING: DesignTuning = { brakeFrontMm: 190, brakeRearMm: 190, downforcePct: 50 }
export const BRAKE_RANGE = { min: 190, max: 380, step: 5 }

/** What the sliders do to the car: bigger discs stop better but weigh and cost more; downforce
 * helps handling and costs a little fuel. */
export function tuningOption(tuning: DesignTuning): ComponentOption {
  const front = (tuning.brakeFrontMm - BRAKE_RANGE.min) / (BRAKE_RANGE.max - BRAKE_RANGE.min)
  const rear = (tuning.brakeRearMm - BRAKE_RANGE.min) / (BRAKE_RANGE.max - BRAKE_RANGE.min)
  const down = (tuning.downforcePct - 50) / 50
  return {
    id: 'designer-tuning',
    label: '',
    unlockYear: 1950,
    costDelta: Math.round(front * 280 + rear * 200),
    weightDeltaKg: Math.round(front * 14 + rear * 10),
    effects: { handling: Math.round(front * 6 + rear * 4 + down * 15) },
    engine: { fuelPct: down * 0.04 },
  }
}

/** A paint colour chosen with two sliders. */
export interface PaintChoice {
  hue: number
  /** Lightness 15-85. */
  light: number
}

export const DEFAULT_PAINT: PaintChoice = { hue: 215, light: 48 }

/** The paint as a #rrggbb colour for the car drawing. */
export function paintHex(paint: PaintChoice): string {
  const h = ((paint.hue % 360) + 360) % 360
  const s = 0.62
  const l = Math.min(0.85, Math.max(0.15, paint.light / 100))
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

export function randomPaint(random: () => number = Math.random): PaintChoice {
  return { hue: Math.floor(random() * 360), light: 25 + Math.floor(random() * 50) }
}

/** The launch presentation a player can pay for with a new car. */
export const PRESENTATION = { cost: 3_000_000, days: 30, efficiency: 1.25, reachPerDay: 3_000 }
