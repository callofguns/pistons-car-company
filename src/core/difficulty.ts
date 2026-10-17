/** The three difficulty levels picked when starting a new company. Everyone starts with the same
 * money - difficulty changes how the world treats you instead. */
export type Difficulty = 'easy' | 'normal' | 'hard'

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

export interface DifficultySettings {
  /** Multiplies every model's daily buyer demand. */
  demandMultiplier: number
  /** Multiplies running costs: building cars, wages, HQ overhead, line upkeep and storage. Upfront
   * purchases (tooling, research, upgrades, ads) keep the price shown on their button. */
  costMultiplier: number
  /** Multiplies loan and overdraft interest rates. */
  interestMultiplier: number
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: { demandMultiplier: 1.3, costMultiplier: 0.85, interestMultiplier: 0.7 },
  normal: { demandMultiplier: 1, costMultiplier: 1, interestMultiplier: 1 },
  hard: { demandMultiplier: 0.75, costMultiplier: 1.15, interestMultiplier: 1.4 },
}

export function difficultySettings(difficulty: Difficulty | undefined): DifficultySettings {
  return DIFFICULTY_SETTINGS[difficulty ?? 'normal']
}
