import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { StealthModeProvider } from './context/StealthModeContext'
import AppRoutes from './routes/AppRoutes'
import { initTenantDevContext } from './utils/tenantDevContext'
import './index.css'

function App() {
  useEffect(() => {
    initTenantDevContext()
  }, [])

  return (
    <LanguageProvider>
      <AuthProvider>
        <StealthModeProvider>
          <ThemeProvider>
            <ToastProvider>
              <div className="h-full overflow-hidden">
                <AppRoutes />
              </div>
            </ToastProvider>
          </ThemeProvider>
        </StealthModeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
