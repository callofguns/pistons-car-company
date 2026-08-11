import { useEffect } from 'react'
import styles from './RotateDeviceGate.module.css'

/**
 * Locks the game to landscape on phones. `screen.orientation.lock()` only works from fullscreen
 * and isn't supported on iOS Safari at all, so it can't be the actual mechanism - it's called
 * here as a best-effort enhancement where it exists, and this CSS-gated overlay (rendered
 * whenever a `@media (orientation: portrait) and (max-height: 560px)` phone is held upright) is
 * what actually guarantees the result. The max-height clause keeps it from firing on a normal
 * desktop browser window that just happens to be tall and narrow.
 */
export function RotateDeviceGate() {
  useEffect(() => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    orientation?.lock?.('landscape').catch(() => {
      // Expected almost everywhere (not fullscreen, or unsupported like iOS Safari) - the CSS
      // overlay below is the real guarantee, this is only a nicety when the platform allows it.
    })
  }, [])

  return (
    <div className={styles.overlay}>
      <span className={styles.icon} aria-hidden="true">
        📱
      </span>
      <p className={styles.message}>Rotate your device to landscape to play Pistons.</p>
    </div>
  )
}
