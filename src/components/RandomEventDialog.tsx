import { useGameStore } from '../store/useGameStore'
import { eventScale, findRandomEvent } from '../core/randomEvents'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button } from './Primitives'
import styles from './RandomEventDialog.module.css'

/** A pop-up asking what to do about a random event. Game time stands still until the player
 * picks one of the choices. */
export function RandomEventDialog() {
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const resolve = useGameStore((s) => s.resolveRandomEvent)
  const { t, fmt } = useT()

  const pending = world.randomEvents.pending
  const event = pending ? findRandomEvent(pending.eventId) : undefined
  if (!pending || !event) return null
  const scale = eventScale(world)

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t(`data.randomEvent.${event.id}.title` as MessageKey)}>
      <div className={styles.dialog}>
        <span className={styles.eyebrow}>{t('randomEvent.eyebrow')}</span>
        <h2 className={styles.title}>{t(`data.randomEvent.${event.id}.title` as MessageKey)}</h2>
        <p className={styles.message}>{t(`data.randomEvent.${event.id}.message` as MessageKey)}</p>
        <div className={styles.choices}>
          {event.choices.map((choice) => {
            const cash = choice.effects.reduce((sum, e) => sum + (e.kind === 'cash' ? e.amount : 0), 0) * scale
            return (
              <Button key={choice.id} variant={choice.id === event.choices[0].id ? 'primary' : 'secondary'} className={styles.choice} onClick={() => resolve(choice.id)}>
                <span>{t(`data.randomEvent.${event.id}.${choice.id}.label` as MessageKey)}</span>
                {cash !== 0 && <span className={styles.cost}>{`${cash < 0 ? '-' : '+'}${fmt.money(Math.abs(cash))}`}</span>}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
