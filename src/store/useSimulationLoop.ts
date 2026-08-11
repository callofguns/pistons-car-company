import { useEffect } from 'react'
import { useGameStore } from './useGameStore'
import { useUiStore } from './useUiStore'
import type { ScreenId } from './screenId'

/** Real time is clamped to this per frame so a backgrounded tab resuming doesn't simulate thousands of days catching up - Unity gets this for free from Time.maximumDeltaTime, this is the explicit web equivalent. */
const MAX_DELTA_SECONDS = 1

/** Game time only advances while the player is looking at the main dashboard - every other screen (design wizard, Research, Employees, ...) pauses the clock so nothing changes behind your back while you're mid-decision. */
const DASHBOARD_SCREEN: ScreenId = 'OfficeHub'

/**
 * Drives the world clock from requestAnimationFrame, the web equivalent of SimulationRunner.cs's
 * Update() loop. Call this once at the app root. Uses store.getState()/tick() directly rather
 * than a subscribed value so the effect only runs once and re-renders are driven entirely by the
 * store's own `revision` bump inside tick(), not by this hook re-running.
 */
export function useSimulationLoop(): void {
  useEffect(() => {
    let animationFrameId: number
    let lastTimestampMs: number | null = null

    const frame = (timestampMs: number) => {
      if (lastTimestampMs !== null) {
        const deltaSeconds = Math.min(MAX_DELTA_SECONDS, (timestampMs - lastTimestampMs) / 1000)
        useGameStore.getState().tick(deltaSeconds)
      }
      lastTimestampMs = timestampMs
      animationFrameId = requestAnimationFrame(frame)
    }

    animationFrameId = requestAnimationFrame(frame)

    const syncPauseWithScreen = (screen: ScreenId) => {
      useGameStore.getState().setPaused(screen !== DASHBOARD_SCREEN)
    }
    syncPauseWithScreen(useUiStore.getState().currentScreen)
    const unsubscribeUiStore = useUiStore.subscribe((state) => syncPauseWithScreen(state.currentScreen))

    const saveOnExit = () => useGameStore.getState().saveNow()
    const saveOnHidden = () => {
      if (document.visibilityState === 'hidden') saveOnExit()
    }
    window.addEventListener('beforeunload', saveOnExit)
    document.addEventListener('visibilitychange', saveOnHidden)

    return () => {
      cancelAnimationFrame(animationFrameId)
      unsubscribeUiStore()
      window.removeEventListener('beforeunload', saveOnExit)
      document.removeEventListener('visibilitychange', saveOnHidden)
    }
  }, [])
}
