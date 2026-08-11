import { addDays, type GameDate } from './gameDate'

/** Advances the in-game calendar in real time (default: 1 day per 2 real seconds). Direct port of TimeService.cs - a plain accumulator, driven externally by tick() so it's trivially unit-testable without a running render loop. */
export interface TimeState {
  currentDate: GameDate
  secondsPerDay: number
  speedMultiplier: number
  /** The effective "should the clock be ticking right now" flag tickTime actually reads - driven
   * every frame by useSimulationLoop from two independent gates: which screen is active (only
   * OfficeHub ticks) and manuallyPaused below. Don't set this directly from UI code. */
  isPaused: boolean
  /** The player's own Pause/Play/Fast preference, via the TopHud playback buttons - persists
   * across screen changes, unlike isPaused itself which the screen-gate can also force true. */
  manuallyPaused: boolean
  accumulatedSeconds: number
}

export function createTimeState(startDate: GameDate, secondsPerDay: number): TimeState {
  return {
    currentDate: startDate,
    secondsPerDay,
    speedMultiplier: 1,
    isPaused: false,
    manuallyPaused: false,
    accumulatedSeconds: 0,
  }
}

/** Advances the clock by deltaSeconds of real time, calling onDayAdvanced once per in-game day crossed (in order). Returns how many days elapsed. */
export function tickTime(time: TimeState, deltaSeconds: number, onDayAdvanced: (today: GameDate) => void): number {
  if (time.isPaused || time.secondsPerDay <= 0) return 0

  time.accumulatedSeconds += deltaSeconds * time.speedMultiplier
  let daysElapsed = 0

  while (time.accumulatedSeconds >= time.secondsPerDay) {
    time.accumulatedSeconds -= time.secondsPerDay
    time.currentDate = addDays(time.currentDate, 1)
    daysElapsed++
    onDayAdvanced(time.currentDate)
  }

  return daysElapsed
}
