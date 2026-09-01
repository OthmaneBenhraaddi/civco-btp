import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getSafeReturnPath } from '../utils/returnPath'

export default function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-[#0D0E11]">
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={getSafeReturnPath(location.state?.from, '/')} replace />
  }

  return <Outlet />
}
