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
  /** Research points earned per day while at least one car is in development (none otherwise). */
  researchPointsPerDay: number
  /** Total addressable population at game start (the HUD's people-icon figure). */
  startingPopulation: number
  racingUnlockYear: number
  autosaveOnMonthRollover: boolean

  /** Daily compounding interest rate charged while the balance is negative. */
  overdraftDailyInterestRate: number
  /** Balance below this triggers the bankruptcy countdown. */
  bankruptcyBalanceThreshold: number
  /** Consecutive days below the threshold before bankruptcy actually triggers. */
  bankruptcyGraceDays: number
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  startingCapital: 45_000_000,
  startYear: 1970,
  startMonth: 1,
  startDay: 1,
  defaultCompanyName: 'Helix',
  defaultHomeCity: 'Rome',
  secondsPerDay: 2,
  // A new company has no research budget until it develops its first car - research points only
  // come in while a car is in development (see world.ts's advanceOneDay).
  startingResearchPoints: 0,
  researchPointsPerDay: 4,
  // People who have heard of the company on day one - see market.ts's awareness(). Grows from
  // word of mouth (every car sold) and ad campaigns.
  startingPopulation: 20_000,
  racingUnlockYear: 1978,
  autosaveOnMonthRollover: true,

  overdraftDailyInterestRate: 0.003,
  bankruptcyBalanceThreshold: -5_000_000,
  bankruptcyGraceDays: 14,
}
