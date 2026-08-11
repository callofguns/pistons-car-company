import { CLASSIFICATION_TAGS, findClassificationTag } from '../../data/classifications'
import styles from './ClassificationPicker.module.css'

interface ClassificationPickerProps {
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
}

/** The reference's dual-slot + 7-tag-card classification picker. Tap a card to select it into the
 * next open slot (or deselect it); a 3rd tap while both slots are full is ignored, matching
 * toggleClassificationTag's core behavior. */
export function ClassificationPicker({ selectedTagIds, onToggle }: ClassificationPickerProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.slots}>
        {[0, 1].map((slotIndex) => {
          const tag = selectedTagIds[slotIndex] ? findClassificationTag(selectedTagIds[slotIndex]) : undefined
          return (
            <div key={slotIndex} className={styles.slot}>
              {tag ? (
                <>
                  <span className={styles.slotLabel}>{tag.label}</span>
                  <span className={styles.slotDescription}>{tag.description}</span>
                </>
              ) : (
                <span className={styles.slotEmpty}>Pick a classification tag</span>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.grid}>
        {CLASSIFICATION_TAGS.map((tag) => {
          const selected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              className={`${styles.tagCard} ${selected ? styles.tagCardSelected : ''}`}
              onClick={() => onToggle(tag.id)}
            >
              {tag.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
