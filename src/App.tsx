import { useEffect } from 'react'
import { useUiStore } from './store/useUiStore'
import { useGameStore } from './store/useGameStore'
import { useSimulationLoop } from './store/useSimulationLoop'
import { TopHud } from './components/TopHud'
import { BankruptcyOverlay } from './components/BankruptcyOverlay'
import { TutorialOverlay } from './components/TutorialOverlay'
import { SCREENS } from './screens'

export function App() {
  useSimulationLoop()
  const currentScreen = useUiStore((s) => s.currentScreen)
  const ScreenComponent = SCREENS[currentScreen]

  useGameStore((s) => s.revision)
  const isBankrupt = useGameStore((s) => s.world.company.isBankrupt)

  useEffect(() => {
    // Best-effort real lock - only takes effect in fullscreen or an installed PWA (Android), per
    // the Screen Orientation API's own restrictions. Everywhere else (the common case: a normal
    // mobile browser tab, or iOS Safari which has no orientation-lock API at all), tokens.css's
    // portrait-media-query transform is what actually guarantees a landscape-shaped app - no
    // "please rotate" prompt needed either way, since that CSS applies unconditionally.
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    orientation?.lock?.('landscape').catch(() => {})
  }, [])

  return (
    <>
      {isBankrupt ? (
        <BankruptcyOverlay />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <TopHud />
          <ScreenComponent />
          <TutorialOverlay />
        </div>
      )}
    </>
  )
}
