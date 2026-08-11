/** Every tunable knob for a new game in one place - direct port of GameConfig.cs. Change balance here, not scattered through components. */
export interface GameConfig {
  startingCapital: number
  startYear: number
  startMonth: number
  startDay: number
  defaultCompanyName: string
  defaultHomeCity: string
  /** Real seconds per in-game day. */
  secondsPerDay: number
  startingResearchPoints: number
  researchPointsPerDay: number
  /** Total addressable population at game start (the HUD's people-icon figure). */
  startingPopulation: number
  /** Starting daily sales volume assumed for all rival manufacturers combined. */
  startingCompetitorDailyVolume: number
  racingUnlockYear: number
  autosaveOnMonthRollover: boolean

  /** Flat monthly HQ maintenance cost, charged as a mandatory expense alongside staff wages. Placeholder until real HQ leveling (spec Section 4) replaces it. */
  hqOverheadPerMonth: number
  /** Daily compounding interest rate charged while the balance is negative. */
  overdraftDailyInterestRate: number
  /** Balance below this triggers the bankruptcy countdown. */
  bankruptcyBalanceThreshold: number
  /** Consecutive days below the threshold before bankruptcy actually triggers. */
  bankruptcyGraceDays: number
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  startingCapital: 250_000,
  startYear: 1974,
  startMonth: 9,
  startDay: 1,
  defaultCompanyName: 'Helix',
  defaultHomeCity: 'Rome',
  secondsPerDay: 2,
  startingResearchPoints: 245,
  researchPointsPerDay: 4,
  startingPopulation: 448_600,
  startingCompetitorDailyVolume: 900,
  racingUnlockYear: 1978,
  autosaveOnMonthRollover: true,

  hqOverheadPerMonth: 15_000,
  overdraftDailyInterestRate: 0.003,
  bankruptcyBalanceThreshold: -150_000,
  bankruptcyGraceDays: 14,
}
