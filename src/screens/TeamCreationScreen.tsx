import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { isRacingUnlocked, RACING_REGISTRATION_COST } from '../core/racing'
import { findRaceTier } from '../data/raceTiers'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/keys'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

const NAME_POOL_KEYS: MessageKey[] = [
  'data.racingNamePool.0',
  'data.racingNamePool.1',
  'data.racingNamePool.2',
  'data.racingNamePool.3',
  'data.racingNamePool.4',
]

/** Resolves a tier id to its display name, falling back to the bare id if the tier can no longer
 * be found (shouldn't happen with the current fixed RACE_TIERS table, but a saved history entry
 * outliving a future data change shouldn't crash the screen). */
function raceTierName(tierId: string, t: ReturnType<typeof useT>['t']): string {
  const tier = findRaceTier(tierId)
  return tier ? t(tier.displayNameKey) : tierId
}

/** "TEAM REGISTRATION" - name the racing team and pay the one-time registration cost. Locked
 * until the configured unlock year. Once registered, doubles as the racing hub: shows the
 * pending entry's status (if any), an "ENTER A RACE" button otherwise, and recent results. */
export function TeamCreationScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const racing = useGameStore((s) => s.world.racing)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const unlockYear = useGameStore((s) => s.config.racingUnlockYear)
  const registerTeam = useGameStore((s) => s.registerTeam)
  const { t, fmt } = useT()

  const [name, setName] = useState(racing.teamName)
  const unlocked = isRacingUnlocked(currentYear, unlockYear)

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`}>
      <Heading>{t('team.registration')}</Heading>
      <span style={{ color: 'var(--color-text-secondary)' }}>{t('team.registerBlurb')}</span>

      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('team.namePlaceholder')}
          disabled={racing.isRegistered}
          style={{ flex: 1, padding: 10 }}
        />
        <Button onClick={() => setName(t(NAME_POOL_KEYS[Math.floor(Math.random() * NAME_POOL_KEYS.length)]))} disabled={racing.isRegistered}>
          🎲
        </Button>
      </div>

      <span style={{ color: 'var(--color-green)' }}>{fmt.compact(RACING_REGISTRATION_COST)}</span>

      {!racing.isRegistered && !unlocked && <span style={{ color: 'var(--color-text-secondary)' }}>{t('team.locked')}</span>}

      <Button
        variant="primary"
        style={{ width: '100%' }}
        disabled={racing.isRegistered || !unlocked}
        onClick={() => registerTeam(name.trim())}
      >
        {racing.isRegistered ? t('team.registered') : unlocked ? t('team.register') : t('team.unavailable')}
      </Button>

      {racing.isRegistered && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {racing.pendingEntry ? (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {t('team.pendingEntry', { tier: raceTierName(racing.pendingEntry.tierId, t), model: racing.pendingEntry.modelName })}
            </span>
          ) : (
            <Button variant="primary" style={{ width: '100%' }} onClick={() => show('RaceEntry')}>
              {t('team.enterRace')}
            </Button>
          )}

          <Heading style={{ fontSize: '1.1rem' }}>{t('team.recentResults')}</Heading>
          {racing.history.length === 0 && <span className={styles.empty}>{t('team.noResultsYet')}</span>}
          {racing.history.slice(0, 5).map((result) => (
            <div key={result.id} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {t('team.resultRow', { tier: raceTierName(result.tierId, t), position: result.position, fieldSize: result.fieldSize })}
              </span>
              <span style={{ color: result.prize > 0 ? 'var(--color-green)' : 'var(--color-text-disabled)' }}>
                {result.prize > 0 ? t('team.resultPrize', { prize: fmt.compact(result.prize) }) : t('team.resultNoPrize')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
