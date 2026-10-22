import { Check, Info, Lock, Package } from 'lucide-react'
import type { ComponentOption, ComponentSlot } from '../../data/designSteps'
import { plainCurrency } from '../../core/numberFormat'
import styles from './OptionStrip.module.css'

interface OptionStripProps {
  slot: ComponentSlot
  selectedOptionId: string | undefined
  isOptionUnlocked: (option: ComponentOption) => boolean
  onSelect: (optionId: string) => void
}

/** A part slot shown as a row of tiles along the bottom of the screen (the reference's "STEEL BODY
 * MATERIAL" strip): the chosen option's name above, every option as a tile, locked ones padlocked. */
export function OptionStrip({ slot, selectedOptionId, isOptionUnlocked, onSelect }: OptionStripProps) {
  const selected = slot.options.find((o) => o.id === selectedOptionId) ?? slot.options[0]
  return (
    <div className={styles.strip}>
      <div className={styles.name}>
        <Info size={15} className={styles.info} />
        <span>
          {selected.label} {slot.label}
        </span>
      </div>
      <div className={styles.tiles}>
        {slot.options.map((option) => {
          const unlocked = isOptionUnlocked(option)
          const isSelected = option.id === selected.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelect(option.id)}
              className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
              aria-pressed={isSelected}
              aria-label={option.label}
              title={option.description}
            >
              {unlocked ? <Package size={26} strokeWidth={1.6} /> : <Lock size={22} />}
              <span className={styles.tileLabel}>{unlocked ? option.label : String(option.unlockYear)}</span>
              {unlocked && option.costDelta !== 0 && <span className={styles.tileCost}>{option.costDelta > 0 ? '+' : ''}{plainCurrency(option.costDelta)}</span>}
              {isSelected && (
                <span className={styles.tick}>
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
