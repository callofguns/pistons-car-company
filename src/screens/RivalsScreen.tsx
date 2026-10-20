import { useGameStore } from '../store/useGameStore'
import { grouped } from '../core/numberFormat'
import { rivalAppeal, type RivalStyle } from '../core/rivals'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { CarArt } from '../art/CarArt'
import styles from './screen.module.css'
import rivalStyles from './RivalsScreen.module.css'

const STYLE_BODY: Record<RivalStyle, string> = { Budget: 'classic-saloon', Luxury: 'executive-sedan', Sports: 'roadster' }
const STYLE_PAINT: Record<string, string> = { marlowe: '#3f8f5a', kessler: '#6a6f7d', corvano: '#d23b3b' }
const STYLE_LABEL: Record<RivalStyle, MessageKey> = {
  Budget: 'rivals.style.Budget',
  Luxury: 'rivals.style.Luxury',
  Sports: 'rivals.style.Sports',
}

/** The competition: a market-share ranking (you and the three rival makers) on the left, and a
 * card per rival - their newest model, how many cars they have sold and how strong they are right
 * now - on the right. Only the card column scrolls. */
export function RivalsScreen() {
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const { t, fmt } = useT()

  const { company, rivals, time } = world
  const year = time.currentDate.year
  const rows = [
    { id: 'you', name: company.companyName, share: company.marketSharePercent, you: true },
    ...rivals.rivals.map((r) => ({ id: r.id, name: r.name, share: r.sharePercent, you: false })),
  ].sort((a, b) => b.share - a.share)
  const topShare = Math.max(1, ...rows.map((r) => r.share))

  return (
    <div className={`${styles.columnsPage}`}>
      <div className={`${styles.column} ${styles.card}`}>
        <h2 className={rivalStyles.heading}>{t('rivals.ranking')}</h2>
        {rows.map((row, i) => (
          <div key={row.id} className={`${rivalStyles.rankRow} ${row.you ? rivalStyles.you : ''}`}>
            <span className={rivalStyles.rank}>{i + 1}</span>
            <div className={rivalStyles.rankBody}>
              <div className={rivalStyles.rankTop}>
                <span className={rivalStyles.rankName}>{row.name}</span>
                <span>{row.share.toFixed(1)}%</span>
              </div>
              <div className={rivalStyles.track}>
                <div className={rivalStyles.fill} style={{ transform: `scaleX(${row.share / topShare})` }} />
              </div>
            </div>
          </div>
        ))}
        <span className={rivalStyles.note}>{t('rivals.rankingNote')}</span>
      </div>

      <div className={`${styles.column} ${rivalStyles.cards}`}>
        {rivals.rivals.map((rival) => {
          const strength = rivalAppeal(rival, year)
          return (
            <div key={rival.id} className={`${styles.card} ${rivalStyles.rival}`}>
              <CarArt bodyId={STYLE_BODY[rival.style]} color={STYLE_PAINT[rival.id] ?? '#888'} className={rivalStyles.car} />
              <div className={rivalStyles.info}>
                <div className={rivalStyles.nameRow}>
                  <span className={rivalStyles.rivalName}>{rival.name}</span>
                  <span className={rivalStyles.chip}>{t(STYLE_LABEL[rival.style])}</span>
                </div>
                <span className={rivalStyles.sub}>{t('rivals.city', { city: rival.city })}</span>
                <span className={rivalStyles.sub}>{t('rivals.newest', { model: rival.modelName, year: rival.modelYear })}</span>
                <span className={rivalStyles.sub}>{t('rivals.sold', { count: grouped(Math.round(rival.totalSold)) })}</span>
                <div className={rivalStyles.strengthRow}>
                  <span>{t('rivals.strength')}</span>
                  <div className={rivalStyles.track}>
                    <div className={rivalStyles.fillRival} style={{ transform: `scaleX(${Math.min(1, strength)})` }} />
                  </div>
                  {rival.launchBoost > 0.03 && <span className={rivalStyles.hot}>{t('rivals.newModelBoost')}</span>}
                </div>
              </div>
            </div>
          )
        })}
        <span className={rivalStyles.note}>{t('rivals.yourSold', { count: fmt.compact(company.totalCarsSoldAllModels).replace(/^\$/, '') })}</span>
      </div>
    </div>
  )
}
