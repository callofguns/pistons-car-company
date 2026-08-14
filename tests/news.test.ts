import { describe, expect, it } from 'vitest'
import { createNewsState, postNews, unreadNewsCount, markAllNewsRead } from '../src/core/news'
import { makeDate } from '../src/core/gameDate'

const DATE = makeDate(1970, 1, 8)

describe('news', () => {
  it('prepends new entries (newest first)', () => {
    const news = createNewsState()
    postNews(news, 'RacingTeamRegistered', DATE, { teamName: 'First' })
    postNews(news, 'RacingTeamRegistered', DATE, { teamName: 'Second' })

    expect(news.entries.map((e) => e.params.teamName)).toEqual(['Second', 'First'])
  })

  it('starts every entry unread', () => {
    const news = createNewsState()
    postNews(news, 'RacingTeamRegistered', DATE, { teamName: 'Ironclad' })
    expect(news.entries[0].read).toBe(false)
  })

  it('caps the ring buffer at 60 and drops the oldest', () => {
    const news = createNewsState()
    for (let i = 0; i < 65; i++) postNews(news, 'RacingTeamRegistered', DATE, { teamName: `Team ${i}` })

    expect(news.entries).toHaveLength(60)
    // Newest (Team 64) survives, oldest 5 (Team 0-4) were evicted.
    expect(news.entries[0].params.teamName).toBe('Team 64')
    expect(news.entries.some((e) => e.params.teamName === 'Team 4')).toBe(false)
  })

  it('derives unread count rather than tracking a stored counter', () => {
    const news = createNewsState()
    postNews(news, 'RacingTeamRegistered', DATE, {})
    postNews(news, 'RacingTeamRegistered', DATE, {})
    expect(unreadNewsCount(news)).toBe(2)

    markAllNewsRead(news)
    expect(unreadNewsCount(news)).toBe(0)
  })

  it('unread count stays correct after the ring buffer evicts unread entries', () => {
    const news = createNewsState()
    for (let i = 0; i < 65; i++) postNews(news, 'RacingTeamRegistered', DATE, {})
    // 65 posted, cap 60 - eviction never breaks the (derived) unread count, unlike a stored one
    // that would need decrementing on every eviction.
    expect(unreadNewsCount(news)).toBe(60)
  })

  // The test that enforces the whole save-data rule this file's module doc describes: a research
  // completion must store the stable nodeId, never a pre-resolved/translated display name -
  // otherwise the entry can't be re-rendered correctly when the player switches language later.
  it('stores content ids in params, never pre-resolved display strings', () => {
    const news = createNewsState()
    postNews(news, 'ResearchCompleted', DATE, { nodeId: 'engine-material' })
    expect(news.entries[0].params.nodeId).toBe('engine-material')
    expect(news.entries[0].params.nodeId).not.toBe('Engine Material')
  })
})
