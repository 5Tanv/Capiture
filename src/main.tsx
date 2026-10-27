import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/lilita-one'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/pixelify-sans/500.css'
import './index.css'
import App from './App'
import { GameProvider } from './state/GameProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
