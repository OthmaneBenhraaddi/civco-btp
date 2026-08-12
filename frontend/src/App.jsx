import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import AppRoutes from './routes/AppRoutes'
import './index.css'
import './design/prodigy.css'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="h-full overflow-hidden">
            <AppRoutes />
          </div>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
