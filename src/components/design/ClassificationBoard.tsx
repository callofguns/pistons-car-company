import { useState, type ComponentType } from 'react'
import { ChevronsUp, Diamond, Flag, Gem, Star, Triangle, Zap, type LucideProps } from 'lucide-react'
import {
  findClassificationTag,
  type ClassificationCategory,
  type ClassificationTagDefinition,
  type ClassificationTagId,
} from '../../data/classifications'
import { useT } from '../../i18n/useT'
import styles from './ClassificationBoard.module.css'

const TAG_ICONS: Record<ClassificationTagId, ComponentType<LucideProps>> = {
  budget: Triangle,
  medium: ChevronsUp,
  'off-road': Diamond,
  premium: Star,
  luxury: Gem,
  sport: Zap,
  track: Flag,
}

/** The order the cards lie in the row at the bottom. */
const CARD_ORDER: ClassificationTagId[] = ['budget', 'medium', 'off-road', 'premium', 'luxury', 'sport', 'track']

const SLOTS: { category: ClassificationCategory; titleKey: 'classificationPicker.class' | 'classificationPicker.type'; hintKey: 'classBoard.hintClass' | 'classBoard.hintType' }[] = [
  { category: 'class', titleKey: 'classificationPicker.class', hintKey: 'classBoard.hintClass' },
  { category: 'type', titleKey: 'classificationPicker.type', hintKey: 'classBoard.hintType' },
]

interface ClassificationBoardProps {
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
}

/** Full-screen classification step, like the reference: two slots at the top (one for the Class
 * of car, one for its Type) and a row of cards below. Tap a card - or drag it onto its slot - to
 * place it; tap a placed card to take it back. */
export function ClassificationBoard({ selectedTagIds, onToggle }: ClassificationBoardProps) {
  const { t } = useT()
  const [dragging, setDragging] = useState<ClassificationTagDefinition | null>(null)
  const cards = CARD_ORDER.map((id) => findClassificationTag(id)).filter((tag): tag is ClassificationTagDefinition => Boolean(tag))

  const placed = (category: ClassificationCategory) =>
    selectedTagIds.map((id) => findClassificationTag(id)).find((tag) => tag?.category === category)

  const drop = (category: ClassificationCategory) => {
    if (dragging && dragging.category === category && !selectedTagIds.includes(dragging.id)) onToggle(dragging.id)
    setDragging(null)
  }

  return (
    <div className={styles.board}>
      <div className={styles.slots}>
        {SLOTS.map(({ category, titleKey, hintKey }) => {
          const tag = placed(category)
          const Icon = tag ? TAG_ICONS[tag.id] : null
          const canDrop = dragging?.category === category
          return (
            <div
              key={category}
              className={`${styles.slot} ${canDrop ? styles.slotReady : ''}`}
              onDragOver={(e) => canDrop && e.preventDefault()}
              onDrop={() => drop(category)}
            >
              <span className={styles.slotTitle}>{t(titleKey)}</span>
              {tag && Icon ? (
                <button type="button" className={styles.placed} onClick={() => onToggle(tag.id)} aria-label={t(tag.labelKey)}>
                  <Icon size={30} />
                  <b>{t(tag.labelKey)}</b>
                  <span>{t(tag.descriptionKey)}</span>
                </button>
              ) : (
                <span className={styles.hint}>
                  <ChevronsUp size={16} />
                  {t(hintKey)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <h2 className={styles.title}>{t('carDesign.step.classification.title')}</h2>

      <div className={styles.cards}>
        {cards.map((tag) => {
          const Icon = TAG_ICONS[tag.id]
          const selected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              draggable={!selected}
              onDragStart={() => setDragging(tag)}
              onDragEnd={() => setDragging(null)}
              className={`${styles.card} ${selected ? styles.cardUsed : ''}`}
              onClick={() => onToggle(tag.id)}
              aria-pressed={selected}
            >
              <Icon size={34} className={styles.cardIcon} />
              <span className={styles.cardLabel}>{t(tag.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
