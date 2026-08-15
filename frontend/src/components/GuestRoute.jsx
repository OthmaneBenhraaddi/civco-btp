import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getHomePathForRole } from '../routes/routeAccess'
import { getSafeReturnPath } from '../utils/returnPath'

export default function GuestRoute() {
  const { isAuthenticated, loading, user, roles, permissions } = useAuth()
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
    const fallback = getHomePathForRole(user?.role, user, roles, permissions)
    return <Navigate to={getSafeReturnPath(location.state?.from, fallback)} replace />
  }

  return <Outlet />
}
