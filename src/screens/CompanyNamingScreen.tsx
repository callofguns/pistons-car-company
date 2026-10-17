import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useTutorialStore } from '../store/useTutorialStore'
import { useT } from '../i18n/useT'
import { listSlotInfo } from '../core/save'
import { DIFFICULTIES, type Difficulty } from '../core/difficulty'
import type { MessageKey } from '../i18n/keys'
import { Button, Heading } from '../components/Primitives'
import { BackButton } from '../components/BackButton'
import styles from './screen.module.css'
import namingStyles from './CompanyNamingScreen.module.css'

/**
 * Step 1 of "+ NEW GAME" - name the company before anything else exists. Continue auto-picks the
 * first empty save slot for it; if every slot is already taken, it hands off to the Save Slots
 * screen instead of silently overwriting one, so the player explicitly picks what gets replaced.
 */
export function CompanyNamingScreen() {
  const show = useUiStore((s) => s.show)
  const goHome = useUiStore((s) => s.goHome)
  const startNewGameInSlot = useGameStore((s) => s.startNewGameInSlot)
  const startTutorial = useTutorialStore((s) => s.start)

  const { t } = useT()

  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const trimmed = name.trim()

  const handleContinue = () => {
    if (!trimmed) return

    // A truly empty slot first, then one holding an unplayable older-version save.
    const slots = listSlotInfo()
    let slotIndex = slots.findIndex((slot) => slot.kind === 'empty')
    if (slotIndex === -1) slotIndex = slots.findIndex((slot) => slot.kind === 'old')
    if (slotIndex === -1) {
      show('SaveSlots', { mode: 'new', pendingCompanyName: trimmed, difficulty })
      return
    }

    startNewGameInSlot(slotIndex, trimmed, difficulty)
    startTutorial()
    goHome('OfficeHub')
  }

  return (
    <div
      className={`${styles.screen} ${styles.centered} ${styles.narrow}`}
      style={{ position: 'relative', justifyContent: 'center' }}
    >
      <BackButton />

      <Heading>{t('companyNaming.heading')}</Heading>

      <input
        className={namingStyles.nameInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
        placeholder={t('companyNaming.placeholder')}
        autoFocus
      />

      <div className={namingStyles.difficulty} role="radiogroup" aria-label={t('companyNaming.difficulty')}>
        {DIFFICULTIES.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={difficulty === level}
            className={`${namingStyles.difficultyOption} ${difficulty === level ? namingStyles.difficultySelected : ''}`}
            onClick={() => setDifficulty(level)}
          >
            <span className={namingStyles.difficultyName}>{t(`difficulty.${level}` as MessageKey)}</span>
            <span className={namingStyles.difficultyDescription}>{t(`difficulty.${level}.description` as MessageKey)}</span>
          </button>
        ))}
      </div>

      <Button variant="primary" style={{ width: '100%' }} disabled={!trimmed} onClick={handleContinue}>
        {t('common.continue')}
      </Button>
    </div>
  )
}
