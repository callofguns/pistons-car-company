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
  startYear: 1970,
  startMonth: 1,
  startDay: 1,
  defaultCompanyName: 'Helix',
  defaultHomeCity: 'Rome',
  secondsPerDay: 2,
  startingResearchPoints: 245,
  researchPointsPerDay: 4,
  // Deliberately tiny - the player explicitly chose to start with almost no reach rather than a
  // pre-established 448.6K audience. Sales demand in market.ts scales with this directly, and its
  // organic-growth formula rounds to zero below ~8,000, so this stays near-flat until something
  // else (marketing, reputation-driven growth if that's ever added) moves it - a known, accepted
  // consequence, not a bug.
  startingPopulation: 100,
  startingCompetitorDailyVolume: 900,
  racingUnlockYear: 1978,
  autosaveOnMonthRollover: true,

  hqOverheadPerMonth: 15_000,
  overdraftDailyInterestRate: 0.003,
  bankruptcyBalanceThreshold: -150_000,
  bankruptcyGraceDays: 14,
}
