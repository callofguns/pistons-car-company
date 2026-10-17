import { Check } from 'lucide-react'
import { CLASSIFICATION_TAGS, findClassificationTag, type ClassificationCategory } from '../../data/classifications'
import { useT } from '../../i18n/useT'
import styles from './ClassificationPicker.module.css'

interface ClassificationPickerProps {
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
}

const GROUPS: { category: ClassificationCategory; headingKey: 'classificationPicker.class' | 'classificationPicker.type'; placeholderKey: 'classificationPicker.pickClass' | 'classificationPicker.pickType' }[] = [
  { category: 'class', headingKey: 'classificationPicker.class', placeholderKey: 'classificationPicker.pickClass' },
  { category: 'type', headingKey: 'classificationPicker.type', placeholderKey: 'classificationPicker.pickType' },
]

/** Two independent single-select groups - Class (price/market tier) then Type (use-case
 * character) - stacked for the design wizard's narrow right-hand column. Each group shows the
 * picked tag's description under its options, so a tap always goes to the matching group. */
export function ClassificationPicker({ selectedTagIds, onToggle }: ClassificationPickerProps) {
  const { t } = useT()

  return (
    <div className={styles.wrap}>
      {GROUPS.map(({ category, headingKey, placeholderKey }) => {
        const selectedId = selectedTagIds.find((id) => findClassificationTag(id)?.category === category)
        const selectedTag = selectedId ? findClassificationTag(selectedId) : undefined
        const options = CLASSIFICATION_TAGS.filter((tag) => tag.category === category)

        return (
          <div key={category} className={styles.group}>
            <span className={styles.groupLabel}>{t(headingKey)}</span>
            <div className={styles.grid}>
              {options.map((tag) => {
                const selected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`${styles.tagCard} ${selected ? styles.tagCardSelected : ''}`}
                    onClick={() => onToggle(tag.id)}
                    aria-pressed={selected}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                    {t(tag.labelKey)}
                  </button>
                )
              })}
            </div>
            <span className={selectedTag ? styles.description : styles.placeholder}>
              {selectedTag ? t(selectedTag.descriptionKey) : t(placeholderKey)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
