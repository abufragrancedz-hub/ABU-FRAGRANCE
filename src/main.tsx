import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

import { LanguageProvider } from './context/LanguageContext'
import { ShopProvider } from './context/ShopContext'
import { TrackingProvider } from './components/TrackingProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ShopProvider>
        <TrackingProvider>
          <App />
        </TrackingProvider>
      </ShopProvider>
    </LanguageProvider>
  </StrictMode>,
)
