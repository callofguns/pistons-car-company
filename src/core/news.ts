import type { GameDate } from './gameDate'

/**
 * Factual, dated company/industry events - distinct from the Rumors feed (company.ts's
 * RumorState), which is unsourced flavor gossip, pre-rendered as plain strings, and never
 * persisted. News is the opposite on every axis: structured entries, persisted, and rendered
 * through the current locale at *read* time rather than baked in at generation time.
 *
 * The save-data rule this file exists to enforce: `params` may only hold player-authored free
 * text, a raw number, or a stable content id - NEVER a translated string. A research completion
 * stores `{ nodeId: 'engine-material' }`, and the renderer (src/i18n/news.ts) resolves
 * `t('data.research.engine-material.name')` in the *reader's* current language. That's what lets
 * the whole feed re-translate correctly when the player switches language later, instead of
 * showing a frozen mix of whatever language was active when each entry was generated.
 */
export type NewsEventType =
  | 'ModelReleased'
  | 'ModelSoldOut'
  | 'ResearchCompleted'
  | 'LoanTaken'
  | 'LoanPaidOff'
  | 'MarketingCampaignStarted'
  | 'MarketingCampaignEnded'
  | 'MonthlyReport'
  | 'BankruptcyWarning'
  | 'RacingTeamRegistered'

export interface NewsEntry {
  id: string
  type: NewsEventType
  date: GameDate
  params: Record<string, string | number>
  read: boolean
}

export interface NewsState {
  /** Newest first - same ordering convention as company.ts's RumorState.recent. */
  entries: NewsEntry[]
}

export function createNewsState(): NewsState {
  return { entries: [] }
}

/** Ring buffer cap, same unshift+truncate idiom as RumorState (30) and LedgerState (200) - News
 * sits between the two: lower-frequency than rumors (which can fire per-model per-day), but
 * meant to cover a whole playthrough's worth of milestones rather than just recent chatter. */
const MAX_NEWS_HISTORY = 60

// A monotonic counter rather than Date.now()-based ids (unlike economy.ts's loan ids) - these ids
// only need to be unique within the 60-entry buffer for React list keys, and determinism makes
// tests readable.
let newsIdCounter = 0

export function postNews(news: NewsState, type: NewsEventType, date: GameDate, params: Record<string, string | number> = {}): void {
  newsIdCounter += 1
  news.entries.unshift({ id: `news-${newsIdCounter}`, type, date, params, read: false })
  if (news.entries.length > MAX_NEWS_HISTORY) news.entries.length = MAX_NEWS_HISTORY
}

/** Derived, not stored - a stored counter would need to be decremented whenever the ring buffer
 * evicts an unread entry, which is exactly the kind of drift-prone bookkeeping worth avoiding for
 * a list this small (60 entries is nothing to scan on every read). */
export function unreadNewsCount(news: NewsState): number {
  return news.entries.filter((e) => !e.read).length
}

export function markAllNewsRead(news: NewsState): void {
  for (const entry of news.entries) entry.read = true
}
