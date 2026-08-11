import { addDays, type GameDate } from './gameDate'

/** Advances the in-game calendar in real time (default: 1 day per 2 real seconds). Direct port of TimeService.cs - a plain accumulator, driven externally by tick() so it's trivially unit-testable without a running render loop. */
export interface TimeState {
  currentDate: GameDate
  secondsPerDay: number
  speedMultiplier: number
  isPaused: boolean
  accumulatedSeconds: number
}

export function createTimeState(startDate: GameDate, secondsPerDay: number): TimeState {
  return { currentDate: startDate, secondsPerDay, speedMultiplier: 1, isPaused: false, accumulatedSeconds: 0 }
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
