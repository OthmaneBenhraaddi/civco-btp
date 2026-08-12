import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, bootstrapError, retryBootstrap } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-[#0b0f17]">
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-[#0b0f17] px-4">
        <div className="max-w-md rounded-2xl border border-[#1e293b] bg-[#151c28] p-6 text-center shadow-xl">
          <p className="text-sm text-slate-300">
            {bootstrapError || t('auth.sessionError')}
          </p>
          <button
            type="button"
            onClick={() => retryBootstrap()}
            className="mt-4 rounded-xl border border-slate-700/60 bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
