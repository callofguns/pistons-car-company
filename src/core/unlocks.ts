import { isResearched, type ResearchState } from './research'

/** Parts, engines and bodies that existed before the game starts are free to use from day one;
 * everything newer has to be researched first (see data/researchNodes.ts's unlock nodes). */
export const FREE_UNTIL_YEAR = 1970

export type UnlockKind = 'part' | 'engine' | 'body'

/** Anything the car designer offers that research can unlock. For a part, id is
 * `<slotId>.<optionId>` (e.g. 'airbags.dual-front'). */
export interface UnlockableItem {
  kind: UnlockKind
  id: string
  unlockYear: number
}

/** "Can the player use this right now?" - passed into the designer and vehicleService. */
export type UnlockCheck = (item: UnlockableItem) => boolean

export function unlockNodeId(item: Pick<UnlockableItem, 'kind' | 'id'>): string {
  return `unlock-${item.kind}-${item.id}`
}

export function needsResearch(item: UnlockableItem): boolean {
  return item.unlockYear > FREE_UNTIL_YEAR
}

/** The real rule: free if it predates the game, otherwise only once its research is done. */
export function unlockedByResearch(research: ResearchState): UnlockCheck {
  return (item) => !needsResearch(item) || isResearched(research, unlockNodeId(item))
}

/** Calendar-only rule (everything up to `year` is usable) - for tests and tools that don't care
 * about research. */
export function unlockedByYear(year: number): UnlockCheck {
  return (item) => item.unlockYear <= year
}

export const partItem = (slotId: string, option: { id: string; unlockYear: number }): UnlockableItem => ({
  kind: 'part',
  id: `${slotId}.${option.id}`,
  unlockYear: option.unlockYear,
})
export const engineItem = (preset: { id: string; unlockYear: number }): UnlockableItem => ({
  kind: 'engine',
  id: preset.id,
  unlockYear: preset.unlockYear,
})
export const bodyItem = (body: { id: string; unlockYear: number }): UnlockableItem => ({
  kind: 'body',
  id: body.id,
  unlockYear: body.unlockYear,
})
