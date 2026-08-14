import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { isRacingUnlocked, RACING_REGISTRATION_COST } from '../core/racing'
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

/** "TEAM REGISTRATION" - name the racing team and pay the one-time registration cost. Locked until the configured unlock year. */
export function TeamCreationScreen() {
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
    </div>
  )
}
