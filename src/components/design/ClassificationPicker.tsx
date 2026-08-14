import { CLASSIFICATION_TAGS, findClassificationTag, type ClassificationCategory } from '../../data/classifications'
import { useT } from '../../i18n/useT'
import styles from './ClassificationPicker.module.css'

interface ClassificationPickerProps {
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
}

const COLUMNS: { category: ClassificationCategory; headingKey: 'classificationPicker.class' | 'classificationPicker.type'; placeholderKey: 'classificationPicker.pickClass' | 'classificationPicker.pickType' }[] = [
  { category: 'class', headingKey: 'classificationPicker.class', placeholderKey: 'classificationPicker.pickClass' },
  { category: 'type', headingKey: 'classificationPicker.type', placeholderKey: 'classificationPicker.pickType' },
]

/** Two independent single-select columns - Class (price/market tier) on the left, Type (use-case
 * character) on the right - each with its own slot box and its own tag list, so a tap always goes
 * to the slot matching that tag's category instead of a shared 2-of-7 pool. Runs full-height/width
 * to fill the wizard's full-screen body rather than clustering as a small centered card. */
export function ClassificationPicker({ selectedTagIds, onToggle }: ClassificationPickerProps) {
  const { t } = useT()

  return (
    <div className={styles.wrap}>
      {COLUMNS.map(({ category, headingKey, placeholderKey }) => {
        const selectedId = selectedTagIds.find((id) => findClassificationTag(id)?.category === category)
        const selectedTag = selectedId ? findClassificationTag(selectedId) : undefined
        const options = CLASSIFICATION_TAGS.filter((t) => t.category === category)

        return (
          <div key={category} className={styles.column}>
            <span className={styles.columnLabel}>{t(headingKey)}</span>

            <div className={styles.slot}>
              {selectedTag ? (
                <>
                  <span className={styles.slotLabel}>{t(selectedTag.labelKey)}</span>
                  <span className={styles.slotDescription}>{t(selectedTag.descriptionKey)}</span>
                </>
              ) : (
                <span className={styles.slotEmpty}>{t(placeholderKey)}</span>
              )}
            </div>

            <div className={styles.grid}>
              {options.map((tag) => {
                const selected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`${styles.tagCard} ${selected ? styles.tagCardSelected : ''}`}
                    onClick={() => onToggle(tag.id)}
                  >
                    {t(tag.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
