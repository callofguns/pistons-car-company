import { useState, type ComponentType } from 'react'
import {
  Activity,
  Armchair,
  Box,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Cog,
  Cylinder,
  Disc,
  Disc3,
  Info,
  Lock,
  Paintbrush,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wind,
  type LucideProps,
} from 'lucide-react'
import type { ComponentOption, ComponentSlot } from '../../data/designSteps'
import { plainCurrency } from '../../core/numberFormat'
import { useT } from '../../i18n/useT'
import styles from './ComponentSlotCard.module.css'

/** A faint line-art icon for each part slot, standing in for the reference's part sketches. */
const SLOT_ICONS: Record<string, ComponentType<LucideProps>> = {
  'body-material': Box,
  airbags: Wind,
  'passive-safety': ShieldCheck,
  'engine-preset': Cylinder,
  'gearbox-type': Cog,
  'drive-type': Settings2,
  suspension: Activity,
  brakes: Disc3,
  'tire-supplier': CircleDot,
  'paint-finish': Paintbrush,
  'wheel-style': Disc,
  'interior-material': Armchair,
  features: Sparkles,
  'aero-package': Wind,
}

interface ComponentSlotCardProps {
  slot: ComponentSlot
  selectedOptionId: string | undefined
  /** Options not yet researched are excluded from cycling - only the nearest one is hinted at. */
  isOptionUnlocked: (option: ComponentOption) => boolean
  onSelect: (optionId: string) => void
}

/** One part picker in the design wizard's right-hand list, laid out like the reference: slot name,
 * the chosen option, a "‹ 1/N ›" switcher and a faint part icon. The (i) corner button flips in
 * the option's description, price and next unlock. */
export function ComponentSlotCard({ slot, selectedOptionId, isOptionUnlocked, onSelect }: ComponentSlotCardProps) {
  const { t } = useT()
  const [showInfo, setShowInfo] = useState(false)
  const unlocked = slot.options.filter(isOptionUnlocked)
  const locked = slot.options.filter((o) => !isOptionUnlocked(o)).sort((a, b) => a.unlockYear - b.unlockYear)

  if (unlocked.length === 0) return null // shouldn't happen - every slot's first option is free

  const index = Math.max(0, unlocked.findIndex((o) => o.id === selectedOptionId))
  const option = unlocked[index]
  const nextLocked = locked[0]
  const Icon = SLOT_ICONS[slot.id] ?? Cog

  return (
    <div className={styles.card}>
      <Icon className={styles.art} strokeWidth={1} aria-hidden="true" />
      <button className={styles.infoButton} onClick={() => setShowInfo((v) => !v)} aria-pressed={showInfo} aria-label={t('component.info', { label: slot.label })}>
        <Info size={13} strokeWidth={2.5} />
      </button>

      <span className={styles.label}>{slot.label}</span>
      <span className={styles.optionName}>{option.label}</span>
      {option.costDelta !== 0 && (
        <span className={styles.costDelta}>
          {option.costDelta > 0 ? '+' : ''}
          {plainCurrency(option.costDelta)}
        </span>
      )}

      {showInfo && (
        <div className={styles.details}>
          {option.description && <span>{option.description}</span>}
          {nextLocked && (
            <span className={styles.lockedHint}>
              <Lock size={11} />
              {t('component.unlocksIn', { label: nextLocked.label })}
            </span>
          )}
        </div>
      )}

      <div className={styles.cycler}>
        <button
          className={styles.arrow}
          onClick={() => onSelect(unlocked[Math.max(0, index - 1)].id)}
          disabled={index <= 0}
          aria-label={t('component.previousLabel', { label: slot.label })}
        >
          <ChevronLeft size={16} />
        </button>
        <span className={styles.index}>
          {index + 1}/{unlocked.length}
        </span>
        <button
          className={styles.arrow}
          onClick={() => onSelect(unlocked[Math.min(unlocked.length - 1, index + 1)].id)}
          disabled={index >= unlocked.length - 1}
          aria-label={t('component.nextLabel', { label: slot.label })}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
