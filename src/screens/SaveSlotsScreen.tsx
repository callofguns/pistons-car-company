import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { clearStorage, listSlots, type SaveGameData } from '../core/save'
import { makeDate } from '../core/gameDate'
import { useT } from '../i18n/useT'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'
import slotStyles from './SaveSlotsScreen.module.css'

interface NewGamePayload {
  mode: 'new'
  pendingCompanyName: string
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
  const back = useUiStore((s) => s.back)
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  const loadSlot = useGameStore((s) => s.loadSlot)
  const startNewGameInSlot = useGameStore((s) => s.startNewGameInSlot)
  const { t, fmt } = useT()

  const newGame = asNewGamePayload(payload)
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  const slots = listSlots()

  const handleSlotClick = (index: number, data: SaveGameData | null) => {
    if (newGame) {
      if (data === null || confirmingIndex === index) {
        startNewGameInSlot(index, newGame.pendingCompanyName)
        show('OfficeHub')
        return
      }
      setConfirmingIndex(index)
      return
    }

    if (data === null) return // nothing to continue in an empty slot
    if (loadSlot(index)) show('OfficeHub')
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
      <Button
        style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', width: 44, height: 44, padding: 0 }}
        onClick={back}
        aria-label={t('common.back')}
      >
        ‹
      </Button>

      <Heading>{newGame ? t('saveSlots.overwriteHeading') : t('menu.saves')}</Heading>
      {newGame && (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {t('saveSlots.everySlotFull', { name: newGame.pendingCompanyName })}
        </span>
      )}

      <div className={slotStyles.list}>
        {slots.map((data, index) => {
          const empty = data === null
          return (
            <div key={index} className={slotStyles.row}>
              <button
                type="button"
                className={slotStyles.slot}
                disabled={!newGame && empty}
                onClick={() => handleSlotClick(index, data)}
              >
                {empty ? (
                  <span className={slotStyles.empty}>{t('saveSlots.emptySlot')}</span>
                ) : (
                  <>
                    <span className={slotStyles.name}>{data.companyName}</span>
                    <span className={slotStyles.meta}>
                      {fmt.date(makeDate(data.year, data.month, data.day))} · {fmt.compact(data.cashBalance)}
                    </span>
                    {confirmingIndex === index && <span className={slotStyles.confirm}>{t('saveSlots.tapAgainToOverwrite')}</span>}
                  </>
                )}
              </button>
              {!newGame && !empty && (
                <button
                  type="button"
                  className={`${slotStyles.deleteButton} ${deletingIndex === index ? slotStyles.deleteConfirming : ''}`}
                  onClick={() => handleDeleteClick(index)}
                  aria-label={t(deletingIndex === index ? 'saveSlots.confirmDelete' : 'saveSlots.delete', { name: data.companyName })}
                >
                  {deletingIndex === index ? '✓' : '🗑'}
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
