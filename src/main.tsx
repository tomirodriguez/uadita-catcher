import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { soundManager } from './audio/SoundManager'

// Preload all sounds early to prevent audio delays during gameplay
soundManager.preload().catch((error) => {
  console.warn('Failed to preload sounds:', error)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
