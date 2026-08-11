import { useUiStore } from './store/useUiStore'
import { useGameStore } from './store/useGameStore'
import { useSimulationLoop } from './store/useSimulationLoop'
import { TopHud } from './components/TopHud'
import { BankruptcyOverlay } from './components/BankruptcyOverlay'
import { SCREENS } from './screens'

export function App() {
  useSimulationLoop()
  const currentScreen = useUiStore((s) => s.currentScreen)
  const ScreenComponent = SCREENS[currentScreen]

  useGameStore((s) => s.revision)
  const isBankrupt = useGameStore((s) => s.world.company.isBankrupt)

  if (isBankrupt) return <BankruptcyOverlay />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHud />
      <ScreenComponent />
    </div>
  )
}
