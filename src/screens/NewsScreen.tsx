import { useEffect } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useT } from '../i18n/useT'
import { renderNewsHeadline } from '../i18n/news'
import { tryLoadFromStorage } from '../core/save'
import type { NewsEntry } from '../core/news'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import newsStyles from './NewsScreen.module.css'

interface MenuPayload {
  slotIndex: number
}

function asMenuPayload(payload: unknown): MenuPayload | null {
  if (typeof payload !== 'object' || payload === null) return null
  const p = payload as Partial<MenuPayload>
  return typeof p.slotIndex === 'number' ? (p as MenuPayload) : null
}

/**
 * Factual company/industry events - see core/news.ts's module doc for how this differs from the
 * Rumors feed on CompanyScreen. Two entry points, two modes:
 *  - from Office Hub (no payload): reads the live world's feed and marks every entry read on
 *    mount, since that's the in-game "I've seen this" signal.
 *  - from the Main Menu (payload.slotIndex, via MainMenuScreen's findMostRecentSlot()): reads
 *    that slot's *saved* feed directly from storage, read-only - there's no live world loaded at
 *    the menu to mark read, and marking a save's entries read without loading/re-saving the whole
 *    game would be more machinery than this is worth.
 */
export function NewsScreen() {
  const back = useUiStore((s) => s.back)
  const payload = useUiStore((s) => s.payload)
  useGameStore((s) => s.revision)
  const liveNews = useGameStore((s) => s.world.news)
  const markAllNewsRead = useGameStore((s) => s.markAllNewsRead)
  const { t, fmt } = useT()

  const menuPayload = asMenuPayload(payload)
  const entries: NewsEntry[] = menuPayload
    ? (tryLoadFromStorage(undefined, menuPayload.slotIndex)?.news ?? [])
    : liveNews.entries

  // Deps intentionally [] rather than [revision] or similar - markAllNewsRead itself bumps
  // revision, and re-running this effect whenever revision changes would be an infinite loop.
  // Safe as a mount-only effect because game time is paused everywhere except Office Hub (see
  // useSimulationLoop's DASHBOARD_SCREEN gate), so no new entry can arrive while this screen is open.
  useEffect(() => {
    if (!menuPayload) markAllNewsRead()
  }, [])

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`} style={{ position: 'relative' }}>
      <Button
        style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', width: 44, height: 44, padding: 0 }}
        onClick={back}
        aria-label={t('common.back')}
      >
        ‹
      </Button>

      <Heading>{t('news.screenTitle')}</Heading>

      <div className={newsStyles.list}>
        {entries.length === 0 && <span className={styles.empty}>{t('news.empty')}</span>}
        {entries.map((entry) => (
          <div key={entry.id} className={`${newsStyles.row} ${!entry.read ? newsStyles.unread : ''}`}>
            <span className={newsStyles.icon} aria-hidden="true">
              📰
            </span>
            <div className={newsStyles.body}>
              <span className={newsStyles.date}>{fmt.date(entry.date)}</span>
              <span className={newsStyles.headline}>{renderNewsHeadline(entry, t, fmt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
