import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './styles/tokens.css'

// autoUpdate: a new service worker silently takes over on next load, no "reload to update"
// prompt - the autosave-on-unload logic already handles save-state persistence independent of
// this, so there's nothing for a mid-session swap to disrupt.
registerSW({ immediate: true })

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('#root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
