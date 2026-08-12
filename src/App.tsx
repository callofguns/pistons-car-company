import { useUiStore } from './store/useUiStore'
import { useGameStore } from './store/useGameStore'
import { useSimulationLoop } from './store/useSimulationLoop'
import { TopHud } from './components/TopHud'
import { BankruptcyOverlay } from './components/BankruptcyOverlay'
import { RotateDeviceGate } from './components/RotateDeviceGate'
import { TutorialOverlay } from './components/TutorialOverlay'
import { SCREENS } from './screens'

export function App() {
  useSimulationLoop()
  const currentScreen = useUiStore((s) => s.currentScreen)
  const ScreenComponent = SCREENS[currentScreen]

  useGameStore((s) => s.revision)
  const isBankrupt = useGameStore((s) => s.world.company.isBankrupt)

  return (
    <>
      {/* Rendered unconditionally ahead of everything else - purely CSS-gated (see the
          component), so it covers the normal screen router and the bankruptcy overlay alike. */}
      <RotateDeviceGate />
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
