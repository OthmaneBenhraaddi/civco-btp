import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { ToastProvider } from './context/ToastContext'
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
        <ThemeProvider>
          <ToastProvider>
            <div className="h-full overflow-hidden">
              <AppRoutes />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
