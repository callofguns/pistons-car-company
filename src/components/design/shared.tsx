import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Star } from 'lucide-react'
import type { CarPerformanceStats } from '../../core/vehicles'
import type { DesignStatKey } from '../../core/designStats'
import type { MessageKey } from '../../i18n/keys'
import { useT } from '../../i18n/useT'
import { Button } from '../Primitives'
import { MeterBar } from '../MeterBar'
import { SpecRow } from '../SpecRow'
import { SpecSheet } from '../SpecSheet'
import layout from '../../screens/showroom.module.css'
import styles from './shared.module.css'

export const DESIGN_STAT_LABEL_KEY: Record<DesignStatKey, MessageKey> = {
  safety: 'data.designStat.safety',
  handling: 'data.designStat.handling',
  offroad: 'data.designStat.offroad',
  comfort: 'data.designStat.comfort',
  prestige: 'data.designStat.prestige',
  attractiveness: 'data.designStat.attractiveness',
}

/** The live spec sheet in the left column, folded away with the bar at its top. */
export function CarSpecsPanel({ stats, engineLiters, designFit }: { stats: CarPerformanceStats | null; engineLiters: number; designFit?: boolean }) {
  const { t } = useT()
  const [open, setOpen] = useState(true)
  return (
    <>
      <button className={layout.sideHeader} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        <span>{t('carDesign.specifications')}</span>
        {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
      {open && stats && (
        <div className={layout.sideList}>
          <SpecSheet stats={stats} engineLiters={engineLiters} />
          {designFit && <SpecRow Icon={Star} label={t('carDesign.designFit')} value={`${Math.round(stats.designFitPercent)}%`} />}
        </div>
      )}
    </>
  )
}

/** Meters under the car, e.g. "15% ▬▬ 100%" for each of this step's stats. */
export function StepMeters({ keys, stats }: { keys: DesignStatKey[]; stats: CarPerformanceStats | null }) {
  const { t } = useT()
  if (!stats) return null
  return (
    <div className={styles.meters}>
      {keys.map((key) => (
        <div key={key} className={styles.meter}>
          <span className={styles.meterLabel}>{t(DESIGN_STAT_LABEL_KEY[key])}</span>
          <div className={styles.meterRow}>
            <span>{Math.round(stats.designStats[key])}%</span>
            <MeterBar value01={stats.designStats[key] / 100} />
            <span className={styles.max}>100%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ContinueButton({
  onClick,
  disabled,
  highlight,
  children,
  className,
}: {
  onClick: () => void
  disabled?: boolean
  highlight?: boolean
  children?: ReactNode
  className?: string
}) {
  const { t } = useT()
  return (
    <Button
      variant="primary"
      data-tutorial-target="wizard-continue"
      className={`${styles.continue} ${highlight ? 'tutorial-target-highlight' : ''} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children ?? t('common.continue')}
    </Button>
  )
}
