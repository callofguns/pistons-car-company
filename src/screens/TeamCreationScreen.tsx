import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { compact } from '../core/numberFormat'
import { isRacingUnlocked, RACING_REGISTRATION_COST } from '../core/racing'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

const NAME_POOL = ['Ironclad Racing', 'Silver Arrow Motorsport', 'Redline Syndicate', 'Vector Racing Team', 'Apex Dynamics']

/** "TEAM REGISTRATION" - name the racing team and pay the one-time registration cost. Locked until the configured unlock year. */
export function TeamCreationScreen() {
  useGameStore((s) => s.revision)
  const racing = useGameStore((s) => s.world.racing)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const unlockYear = useGameStore((s) => s.config.racingUnlockYear)
  const registerTeam = useGameStore((s) => s.registerTeam)

  const [name, setName] = useState(racing.teamName)
  const unlocked = isRacingUnlocked(currentYear, unlockYear)

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`}>
      <Heading>TEAM REGISTRATION</Heading>
      <span style={{ color: 'var(--color-text-secondary)' }}>
        Register your racing team and restore the garage to compete in events
      </span>

      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
          disabled={racing.isRegistered}
          style={{ flex: 1, padding: 10 }}
        />
        <Button onClick={() => setName(NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)])} disabled={racing.isRegistered}>
          🎲
        </Button>
      </div>

      <span style={{ color: 'var(--color-green)' }}>{compact(RACING_REGISTRATION_COST)}</span>

      {!racing.isRegistered && !unlocked && (
        <span style={{ color: 'var(--color-text-secondary)' }}>Racing unlocks later in the company's history.</span>
      )}

      <Button
        variant="primary"
        style={{ width: '100%' }}
        disabled={racing.isRegistered || !unlocked}
        onClick={() => registerTeam(name.trim())}
      >
        {racing.isRegistered ? 'REGISTERED' : unlocked ? 'REGISTER' : 'UNAVAILABLE'}
      </Button>
    </div>
  )
}
