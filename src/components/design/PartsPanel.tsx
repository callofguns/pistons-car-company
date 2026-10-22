import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { STEP_PARTS, TIRE_TRAITS, type PartRow } from '../../data/designParts'
import { DESIGN_STEPS, type ComponentOption, type ComponentSlot } from '../../data/designSteps'
import { translateDesignStep } from '../../i18n/designSteps'
import { useT } from '../../i18n/useT'
import type { MessageKey } from '../../i18n/keys'
import { BRAKE_RANGE, type DesignTuning } from '../../core/carTuning'
import { ComponentSlotCard } from './ComponentSlotCard'
import { SliderCard } from './SliderCard'
import layout from '../../screens/showroom.module.css'
import styles from './PartsPanel.module.css'

interface PartsPanelProps {
  stepId: string
  part: number
  onPart: (part: number) => void
  selections: Record<string, string>
  isUnlocked: (slotId: string, option: ComponentOption) => boolean
  onSelect: (slotId: string, optionId: string) => void
  tuning: DesignTuning
  onTuning: (patch: Partial<DesignTuning>) => void
}

/** Every slot of the designer with its English text swapped for the current language. */
export function useTranslatedSlots(): Map<string, ComponentSlot> {
  const { t } = useT()
  return useMemo(() => {
    const map = new Map<string, ComponentSlot>()
    for (const step of DESIGN_STEPS) for (const slot of translateDesignStep(step, t).slots) map.set(slot.id, slot)
    return map
  }, [t])
}

/** The right-hand column of a designer step: the part's name with arrows to the other parts of the
 * step, then its rows. */
export function PartsPanel({ stepId, part, onPart, selections, isUnlocked, onSelect, tuning, onTuning }: PartsPanelProps) {
  const { t } = useT()
  const slots = useTranslatedSlots()
  const parts = STEP_PARTS[stepId] ?? []
  const current = parts[Math.min(part, parts.length - 1)]
  if (!current) return null
  const go = (delta: number) => onPart((part + delta + parts.length) % parts.length)

  const renderRow = (row: PartRow) => {
    if (row.kind === 'brake') {
      const label = t(row.field === 'brakeFrontMm' ? 'carDesign.slider.brakeFront' : 'carDesign.slider.brakeRear')
      return (
        <SliderCard
          key={row.field}
          label={label}
          valueText={t('carDesign.slider.mm', { value: tuning[row.field] })}
          value={tuning[row.field]}
          min={BRAKE_RANGE.min}
          max={BRAKE_RANGE.max}
          step={BRAKE_RANGE.step}
          onChange={(value) => onTuning({ [row.field]: value })}
        />
      )
    }
    const slot = slots.get(row.slotId)
    if (!slot) return null
    if (current.cards) {
      return <OptionCards key={row.slotId} slot={slot} selectedId={selections[row.slotId]} isUnlocked={(o) => isUnlocked(row.slotId, o)} onSelect={(id) => onSelect(row.slotId, id)} />
    }
    return (
      <ComponentSlotCard
        key={row.slotId}
        slot={slot}
        selectedOptionId={selections[row.slotId]}
        isOptionUnlocked={(option) => isUnlocked(row.slotId, option)}
        onSelect={(id) => onSelect(row.slotId, id)}
      />
    )
  }

  return (
    <>
      <div className={layout.partsHeader}>
        {parts.length > 1 && (
          <button className={layout.partsArrow} onClick={() => go(-1)} aria-label={t('engineBuilder.previousPart')}>
            <ChevronLeft size={18} />
          </button>
        )}
        <span className={styles.title}>{t(current.titleKey)}</span>
        {parts.length > 1 && (
          <button className={layout.partsArrow} onClick={() => go(1)} aria-label={t('engineBuilder.nextPart')}>
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      {parts.length > 1 && (
        <div className={styles.pager} aria-hidden="true">
          {parts.map((_, i) => (
            <span key={i} className={`${styles.dash} ${i === part ? styles.dashActive : ''}`} />
          ))}
        </div>
      )}
      <div className={layout.sideList}>{current.rows.map(renderRow)}</div>
    </>
  )
}

/** The tire suppliers as cards: a name in the brand's style and what it is good and bad at. */
function OptionCards({
  slot,
  selectedId,
  isUnlocked,
  onSelect,
}: {
  slot: ComponentSlot
  selectedId: string | undefined
  isUnlocked: (option: ComponentOption) => boolean
  onSelect: (optionId: string) => void
}) {
  const { t } = useT()
  const traitText = (trait: 'handling' | 'offroad' | 'price' | 'grip', level: 2 | 1 | -1) => {
    if (trait === 'price' || trait === 'offroad') return t(`carDesign.trait.${trait}` as MessageKey)
    const word = level === 2 ? t('carDesign.trait.excellent') : level === 1 ? t('carDesign.trait.good') : t('carDesign.trait.weak')
    return `${word} ${t(`carDesign.trait.${trait}` as MessageKey)}`
  }
  return (
    <>
      {slot.options.filter(isUnlocked).map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${styles.card} ${option.id === selectedId ? styles.cardSelected : ''}`}
          onClick={() => onSelect(option.id)}
          aria-pressed={option.id === selectedId}
        >
          <span className={`${styles.brand} ${styles[`brand_${option.id}` as keyof typeof styles] ?? ''}`}>{option.label}</span>
          <span className={styles.traits}>
            {(TIRE_TRAITS[option.id] ?? []).map(({ trait, level }) => (
              <span key={trait} className={level > 0 ? styles.good : styles.bad}>
                {level > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {traitText(trait, level)}
              </span>
            ))}
          </span>
        </button>
      ))}
    </>
  )
}
