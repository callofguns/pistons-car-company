import { tryWithdraw, type BankState } from './economy'

/** Registers the player's motorsport team - the "TEAM REGISTRATION" screen. Registration only for this pass, no race simulation yet. Direct port of RacingService.cs. */
export interface RacingState {
  isRegistered: boolean
  teamName: string
}

export const RACING_REGISTRATION_COST = 40_000_000

export function createRacingState(): RacingState {
  return { isRegistered: false, teamName: '' }
}

export function isRacingUnlocked(currentYear: number, unlockYear: number): boolean {
  return currentYear >= unlockYear
}

export function registerTeam(
  racing: RacingState,
  teamName: string,
  bank: BankState,
  currentYear: number,
  unlockYear: number,
): boolean {
  if (racing.isRegistered) return false
  if (!isRacingUnlocked(currentYear, unlockYear)) return false
  if (!teamName.trim()) return false
  if (!tryWithdraw(bank, RACING_REGISTRATION_COST)) return false

  racing.teamName = teamName
  racing.isRegistered = true
  return true
}
