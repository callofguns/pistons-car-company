import { useUiStore } from './store/useUiStore'
import { useSimulationLoop } from './store/useSimulationLoop'
import { TopHud } from './components/TopHud'
import { SCREENS } from './screens'

export function App() {
  useSimulationLoop()
  const currentScreen = useUiStore((s) => s.currentScreen)
  const ScreenComponent = SCREENS[currentScreen]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHud />
      <ScreenComponent />
    </div>
  )
}
