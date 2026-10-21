import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { clearStorage, listSlotInfo, type SlotInfo } from '../core/save'
import type { Difficulty } from '../core/difficulty'
import type { FounderProfile } from '../core/foundation'
import { useTutorialStore } from '../store/useTutorialStore'
import { makeDate } from '../core/gameDate'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button, Heading } from '../components/Primitives'
import { BackButton } from '../components/BackButton'
import styles from './screen.module.css'
import slotStyles from './SaveSlotsScreen.module.css'

interface NewGamePayload {
  mode: 'new'
  pendingCompanyName: string
  difficulty: Difficulty
  founder?: FounderProfile
  tutorial?: boolean
}

function asNewGamePayload(payload: unknown): NewGamePayload | null {
  if (typeof payload !== 'object' || payload === null) return null
  const p = payload as Partial<NewGamePayload>
  return p.mode === 'new' && typeof p.pendingCompanyName === 'string' ? (p as NewGamePayload) : null
}

/**
 * Doubles as the main "Saves" hub reached from Main Menu (no payload - browse/resume/delete/start
 * new) and the "every slot's full" fallback from Company Naming (payload.mode === 'new' - pick a
 * slot to overwrite). Browse mode leaves empty slots inert to tap (there's a dedicated + NEW GAME
 * button for that instead, which reuses Company Naming's own empty-slot-or-overwrite logic);
 * new-game mode requires a second tap on an occupied slot before it overwrites. Deleting a slot
 * works the same second-tap-to-confirm way, and is only offered in browse mode - the overwrite
 * flow already has its own "are you sure" via the second tap on the slot itself.
 */
export function SaveSlotsScreen() {
  const show = useUiStore((s) => s.show)
  const goHome = useUiStore((s) => s.goHome)
  const payload = useUiStore((s) => s.payload)
  const loadSlot = useGameStore((s) => s.loadSlot)
  const startNewGameInSlot = useGameStore((s) => s.startNewGameInSlot)
  const startTutorial = useTutorialStore((s) => s.start)
  const { t, fmt } = useT()

  const newGame = asNewGamePayload(payload)
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  const slots = listSlotInfo()

  const handleSlotClick = (index: number, slot: SlotInfo) => {
    if (newGame) {
      if (slot.kind !== 'save' || confirmingIndex === index) {
        startNewGameInSlot(index, newGame.pendingCompanyName, newGame.difficulty ?? 'normal', newGame.founder)
        if (newGame.tutorial) startTutorial()
        goHome('OfficeHub')
        return
      }
      setConfirmingIndex(index)
      return
    }

    if (slot.kind !== 'save') return // nothing playable in this slot
    if (loadSlot(index)) goHome('OfficeHub')
  }

  const handleDeleteClick = (index: number) => {
    if (deletingIndex === index) {
      clearStorage(undefined, index)
      setDeletingIndex(null)
    } else {
      setDeletingIndex(index)
    }
  }

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`} style={{ position: 'relative' }}>
      <BackButton />

      <Heading>{newGame ? t('saveSlots.overwriteHeading') : t('menu.saves')}</Heading>
      {newGame && (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {t('saveSlots.everySlotFull', { name: newGame.pendingCompanyName })}
        </span>
      )}

      <div className={slotStyles.list}>
        {slots.map((slot, index) => {
          const data = slot.kind === 'save' ? slot.data : null
          const deletable = !newGame && slot.kind !== 'empty'
          const deleteName = data ? data.companyName : t('saveSlots.oldSave')
          return (
            <div key={index} className={slotStyles.row}>
              <button
                type="button"
                className={slotStyles.slot}
                disabled={!newGame && slot.kind !== 'save'}
                onClick={() => handleSlotClick(index, slot)}
              >
                {slot.kind === 'empty' && <span className={slotStyles.empty}>{t('saveSlots.emptySlot')}</span>}
                {slot.kind === 'old' && (
                  <>
                    <span className={slotStyles.name}>{t('saveSlots.oldVersion')}</span>
                    <span className={slotStyles.meta}>{t('saveSlots.oldVersionHint')}</span>
                  </>
                )}
                {data && (
                  <>
                    <span className={slotStyles.name}>{data.companyName}</span>
                    <span className={slotStyles.meta}>
                      {fmt.date(makeDate(data.year, data.month, data.day))} · {fmt.money(data.cashBalance)} · {t(`difficulty.${data.difficulty}` as MessageKey)}
                    </span>
                    {confirmingIndex === index && <span className={slotStyles.confirm}>{t('saveSlots.tapAgainToOverwrite')}</span>}
                  </>
                )}
              </button>
              {deletable && (
                <button
                  type="button"
                  className={`${slotStyles.deleteButton} ${deletingIndex === index ? slotStyles.deleteConfirming : ''}`}
                  onClick={() => handleDeleteClick(index)}
                  aria-label={t(deletingIndex === index ? 'saveSlots.confirmDelete' : 'saveSlots.delete', { name: deleteName })}
                >
                  {deletingIndex === index ? <Check size={18} strokeWidth={3} /> : <Trash2 size={18} />}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!newGame && <Button onClick={() => show('CompanyNaming')}>{t('saveSlots.newGame')}</Button>}
    </div>
  )
}
