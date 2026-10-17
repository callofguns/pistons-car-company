import { useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  Banknote,
  Building2,
  Car,
  ChartColumn,
  Flag,
  FlaskConical,
  Landmark,
  Megaphone,
  Newspaper,
  PackageCheck,
  TriangleAlert,
  Trophy,
  type LucideProps,
} from 'lucide-react'
import { useUiStore } from '../store/useUiStore'
import type { NewsEventType } from '../core/news'
import { useGameStore } from '../store/useGameStore'
import { useT } from '../i18n/useT'
import { renderNewsHeadline } from '../i18n/news'
import { tryLoadFromStorage } from '../core/save'
import type { NewsEntry } from '../core/news'
import { Heading } from '../components/Primitives'
import { BackButton } from '../components/BackButton'
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
      <BackButton />

      <Heading>{t('news.screenTitle')}</Heading>

      <div className={`${styles.fill} ${newsStyles.list}`}>
        {entries.length === 0 && <span className={styles.empty}>{t('news.empty')}</span>}
        {entries.map((entry) => (
          <div key={entry.id} className={`${newsStyles.row} ${!entry.read ? newsStyles.unread : ''}`}>
            <NewsIcon type={entry.type} />
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

const NEWS_ICONS: Partial<Record<NewsEventType, { Icon: ComponentType<LucideProps>; color: string }>> = {
  ModelReleased: { Icon: Car, color: 'var(--color-accent-hover)' },
  ModelSoldOut: { Icon: PackageCheck, color: 'var(--color-green)' },
  ResearchCompleted: { Icon: FlaskConical, color: '#8fb4ff' },
  LoanTaken: { Icon: Landmark, color: 'var(--color-trim)' },
  LoanPaidOff: { Icon: Banknote, color: 'var(--color-green)' },
  MarketingCampaignStarted: { Icon: Megaphone, color: 'var(--color-accent-hover)' },
  MarketingCampaignEnded: { Icon: Megaphone, color: 'var(--color-text-secondary)' },
  MonthlyReport: { Icon: ChartColumn, color: 'var(--color-text-secondary)' },
  BankruptcyWarning: { Icon: TriangleAlert, color: 'var(--color-danger)' },
  RacingTeamRegistered: { Icon: Flag, color: 'var(--color-trim)' },
  RaceCompleted: { Icon: Trophy, color: 'var(--color-trim)' },
  HQUpgraded: { Icon: Building2, color: 'var(--color-accent-hover)' },
}

/** A colored icon per kind of headline, so the feed scans at a glance. */
function NewsIcon({ type }: { type: NewsEventType }) {
  const { Icon, color } = NEWS_ICONS[type] ?? { Icon: Newspaper, color: 'var(--color-text-secondary)' }
  return (
    <span className={newsStyles.icon} aria-hidden="true" style={{ color }}>
      <Icon size={18} />
    </span>
  )
}
