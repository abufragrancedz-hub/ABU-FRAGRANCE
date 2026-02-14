import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ShopProvider } from './context/ShopContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <ShopProvider>
          <App />
        </ShopProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
)
