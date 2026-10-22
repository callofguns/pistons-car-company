import { useEffect, useRef, useState } from 'react'
import { Power } from 'lucide-react'
import { useT } from '../../i18n/useT'
import styles from './EngineGauges.module.css'

interface EngineGaugesProps {
  maxRpm: number
  boosted: boolean
}

const MAX_GAUGE_RPM = 9000
const SWEEP = 260

/** The last builder section: a rev counter and a boost gauge, and a button that revs the engine
 * up to its limit and back down. */
export function EngineGauges({ maxRpm, boosted }: EngineGaugesProps) {
  const { t } = useT()
  const [rpm, setRpm] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
  }, [])

  const start = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    const began = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - began) / 1000
      // up in 1.1 seconds, a short hold, then settle to idle
      const value = elapsed < 1.1 ? (elapsed / 1.1) ** 1.5 * maxRpm : elapsed < 1.5 ? maxRpm : Math.max(0, maxRpm * (1 - (elapsed - 1.5) / 1.2))
      setRpm(Math.round(value))
      frame.current = elapsed < 2.7 ? requestAnimationFrame(tick) : null
      if (elapsed >= 2.7) setRpm(0)
    }
    frame.current = requestAnimationFrame(tick)
  }

  const angle = (value: number) => -130 + (Math.min(value, MAX_GAUGE_RPM) / MAX_GAUGE_RPM) * SWEEP
  const redStart = angle(maxRpm)
  const arc = (from: number, to: number, r: number) => {
    const p = (a: number) => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)]
    const [x1, y1] = p(from)
    const [x2, y2] = p(to)
    return `M${x1},${y1} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2},${y2}`
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.gauges}>
        <svg className={styles.small} viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="56" fill="rgba(8,14,38,0.7)" stroke="rgba(160,190,255,0.3)" strokeWidth="2" />
          <line x1="60" y1="60" x2="60" y2="18" stroke="#ef5350" strokeWidth="3" strokeLinecap="round" transform={`rotate(${boosted ? -20 + Math.min(1, rpm / maxRpm) * 80 : -60} 60 60)`} />
          <circle cx="60" cy="60" r="5" fill="#cfd8f0" />
        </svg>
        <svg className={styles.big} viewBox="0 0 200 200" role="img" aria-label={t('engineBuilder.rpm')}>
          <circle cx="100" cy="100" r="96" fill="rgba(8,14,38,0.75)" stroke="rgba(160,190,255,0.35)" strokeWidth="2" />
          <path d={arc(-130, 130, 82)} fill="none" stroke="rgba(160,190,255,0.2)" strokeWidth="6" />
          <path d={arc(redStart, 130, 82)} fill="none" stroke="#ef5350" strokeWidth="8" strokeLinecap="round" />
          <line x1="100" y1="100" x2="100" y2="34" stroke="#f3f6ff" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle(rpm)} 100 100)`} />
          <circle cx="100" cy="100" r="9" fill="#f3f6ff" />
          <text x="100" y="140" textAnchor="middle" fill="#a8b5dc" fontSize="13">{t('engineBuilder.rpm')}</text>
          <text x="100" y="164" textAnchor="middle" fill="#f3f6ff" fontSize="24" fontWeight="600">{rpm}</text>
        </svg>
      </div>
      <button type="button" className={styles.start} onClick={start}>
        <Power size={26} />
        <span>{t('engineBuilder.pressToStart')}</span>
      </button>
    </div>
  )
}
