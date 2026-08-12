import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { listSlots, type SaveGameData } from '../core/save'
import { formatDate, makeDate } from '../core/gameDate'
import { compact } from '../core/numberFormat'
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
 * Doubles as the "Continue" slot picker (Main Menu, no payload) and the "every slot's full"
 * fallback from Company Naming (payload.mode === 'new') - same list of slots either way, just a
 * different meaning for tapping one. Continue mode leaves empty slots inert (nothing to resume);
 * new-game mode requires a second tap on an occupied slot before it overwrites, so a stray tap
 * can't destroy a save.
 */
export function SaveSlotsScreen() {
  const back = useUiStore((s) => s.back)
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  const loadSlot = useGameStore((s) => s.loadSlot)
  const startNewGameInSlot = useGameStore((s) => s.startNewGameInSlot)

  const newGame = asNewGamePayload(payload)
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null)

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

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`} style={{ position: 'relative' }}>
      <Button
        style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', width: 44, height: 44, padding: 0 }}
        onClick={back}
        aria-label="Back"
      >
        ‹
      </Button>

      <Heading>{newGame ? 'CHOOSE A SLOT TO OVERWRITE' : 'SELECT SAVE'}</Heading>
      {newGame && (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Every slot is full - pick one to start "{newGame.pendingCompanyName}" in. This can't be undone.
        </span>
      )}

      <div className={slotStyles.list}>
        {slots.map((data, index) => {
          const empty = data === null
          return (
            <button
              key={index}
              type="button"
              className={slotStyles.slot}
              disabled={!newGame && empty}
              onClick={() => handleSlotClick(index, data)}
            >
              {empty ? (
                <span className={slotStyles.empty}>Empty Slot</span>
              ) : (
                <>
                  <span className={slotStyles.name}>{data.companyName}</span>
                  <span className={slotStyles.meta}>
                    {formatDate(makeDate(data.year, data.month, data.day))} · {compact(data.cashBalance)}
                  </span>
                  {confirmingIndex === index && <span className={slotStyles.confirm}>Tap again to overwrite</span>}
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
