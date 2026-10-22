import { useState } from 'react'
import { ArrowLeft, Check, Leaf, MapPin, X } from 'lucide-react'
import { SALES_REGIONS, findSalesRegion, type SalesRegionDefinition } from '../../data/salesRegions'
import { passesEmissions, regionEmissionLimit, regionFees } from '../../core/salesRegions'
import type { CarClass } from '../../core/vehicles'
import { useT } from '../../i18n/useT'
import type { MessageKey } from '../../i18n/keys'
import { CAR_CLASS_KEY } from '../../i18n/vehicles'
import { Button } from '../Primitives'
import styles from './SalesRegionsView.module.css'

interface SalesRegionsViewProps {
  chosen: string[]
  onChange: (regionIds: string[]) => void
  emissionsGKm: number
  year: number
  carClass: CarClass | undefined
  onContinue: () => void
  tutorial?: React.ReactNode
}

/** Rough continent shapes, drawn in a 100 x 100 box that the pins are placed on. */
const CONTINENTS = [
  'M6,20 L14,12 L26,10 L34,14 L33,22 L29,30 L26,38 L22,46 L18,44 L14,36 L8,30 Z',
  'M36,6 L44,5 L45,12 L40,16 Z',
  'M26,52 L34,50 L40,56 L38,68 L33,82 L29,86 L27,72 L25,60 Z',
  'M46,24 L52,18 L62,16 L76,16 L90,22 L94,34 L86,44 L78,52 L70,58 L66,50 L60,46 L54,44 L48,38 Z',
  'M46,42 L58,42 L64,50 L60,62 L56,74 L52,76 L48,64 L44,52 Z',
  'M72,70 L86,70 L90,78 L82,86 L72,82 Z',
]

/** Choose which parts of the world the car is sold in: a world map with a pin per region, and a
 * panel for each with its emission rules, price and how much it likes this kind of car. */
export function SalesRegionsView({ chosen, onChange, emissionsGKm, year, carClass, onContinue, tutorial }: SalesRegionsViewProps) {
  const { t, fmt } = useT()
  const [openId, setOpenId] = useState<string | null>(null)
  const open = openId ? findSalesRegion(openId) : undefined
  const total = regionFees(chosen)

  const toggle = (region: SalesRegionDefinition) => {
    if (chosen.includes(region.id)) onChange(chosen.filter((id) => id !== region.id))
    else if (passesEmissions(region, emissionsGKm, year)) onChange([...chosen, region.id])
  }

  const penalty = (region: SalesRegionDefinition) => {
    const preference = carClass ? region.classPreference[carClass] ?? 1 : 1
    if (preference >= 1.1) return `+${Math.round((preference - 1) * 100)}% ${t(CAR_CLASS_KEY[carClass!])}`
    if (preference <= 0.9) return `${Math.round((preference - 1) * 100)}% ${t(CAR_CLASS_KEY[carClass!])}`
    return t('salesRegions.noPenalties')
  }

  return (
    <div className={styles.screen}>
      <svg className={styles.map} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {CONTINENTS.map((d) => (
          <path key={d} d={d} fill="rgba(210, 230, 245, 0.18)" />
        ))}
      </svg>
      {tutorial && <div className={styles.tutorial}>{tutorial}</div>}

      <div className={styles.heading}>
        <h2>{t('salesRegions.title')}</h2>
        <span className={styles.price}>
          {t('salesRegions.price')}
          <b>{total > 0 ? fmt.money(total) : '0'}</b>
        </span>
      </div>

      <div className={`${styles.mapArea} ${open ? styles.shifted : ''}`}>
        {SALES_REGIONS.map((region) => {
          const selected = chosen.includes(region.id)
          const failed = !passesEmissions(region, emissionsGKm, year)
          return (
            <button
              key={region.id}
              type="button"
              className={`${styles.pin} ${selected ? styles.pinChosen : ''} ${failed ? styles.pinFailed : ''} ${openId === region.id ? styles.pinOpen : ''}`}
              style={{ left: `${region.map.x}%`, top: `${region.map.y}%` }}
              onClick={() => setOpenId(region.id)}
            >
              <span className={styles.diamond}>
                <MapPin size={18} />
              </span>
              <span className={styles.pinLabel}>{t(`data.region.${region.id}.name` as MessageKey)}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.footer}>
        <Button variant="primary" className={styles.continue} disabled={chosen.length === 0} onClick={onContinue} data-tutorial-target="wizard-continue">
          {chosen.length === 0 ? t('salesRegions.unavailable') : t('common.continue')}
        </Button>
      </div>

      {open && (
        <aside className={styles.panel}>
          <button type="button" className={styles.close} onClick={() => setOpenId(null)} aria-label={t('salesRegions.back')}>
            <ArrowLeft size={18} />
          </button>
          <RegionPicture id={open.id} />
          <h3>{t(`data.region.${open.id}.name` as MessageKey)}</h3>
          <p>{t(`data.region.${open.id}.desc` as MessageKey)}</p>
          <div className={styles.row}>
            <span>
              <Leaf size={16} /> {t('salesRegions.ecoStandard')}
            </span>
            <b>{regionEmissionLimit(open, year) >= 999 ? '999 G/KM' : t('salesRegions.limit', { value: regionEmissionLimit(open, year) })}</b>
          </div>
          <div className={`${styles.verdict} ${passesEmissions(open, emissionsGKm, year) ? styles.pass : styles.fail}`}>
            {passesEmissions(open, emissionsGKm, year) ? (
              <>
                <Check size={14} /> {t('salesRegions.pass')}
              </>
            ) : (
              <>
                <X size={14} /> {t('salesRegions.fail')}
              </>
            )}
          </div>
          <div className={styles.row}>
            <span>{t('salesRegions.priceRow')}</span>
            <b>{fmt.money(open.fee)}</b>
          </div>
          <div className={styles.penalty}>{penalty(open)}</div>
          <Button
            variant="primary"
            className={styles.choose}
            disabled={!chosen.includes(open.id) && !passesEmissions(open, emissionsGKm, year)}
            onClick={() => toggle(open)}
          >
            {chosen.includes(open.id) ? (
              <>
                <X size={16} /> {t('salesRegions.remove')}
              </>
            ) : (
              <>
                <Check size={16} /> {t('salesRegions.choose')}
              </>
            )}
          </Button>
        </aside>
      )}
    </div>
  )
}

/** A small painted scene for the region panel, in a colour of its own. */
function RegionPicture({ id }: { id: string }) {
  const hue = (SALES_REGIONS.findIndex((r) => r.id === id) * 47 + 20) % 360
  return (
    <svg className={styles.picture} viewBox="0 0 200 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`rp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 55% 62%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 30) % 360} 60% 78%)`} />
        </linearGradient>
      </defs>
      <rect width="200" height="80" fill={`url(#rp-${id})`} />
      <path d="M0,60 L40,28 L70,52 L110,22 L150,50 L200,30 L200,80 L0,80 Z" fill={`hsl(${hue} 35% 38%)`} />
      {[20, 40, 56, 150, 168].map((x, i) => (
        <rect key={x} x={x} y={46 - (i % 3) * 8} width="9" height={26 + (i % 3) * 8} fill="#3a4258" opacity="0.85" />
      ))}
      <path d="M0,72 L200,66 L200,80 L0,80 Z" fill="#40455a" />
    </svg>
  )
}
