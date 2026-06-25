import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getHomePathForRole, isAdminOnlyPath } from '../routes/routeAccess'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, isAdmin, user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-[#0b0c0e] text-slate-400">
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin && isAdminOnlyPath(location.pathname)) {
    return <Navigate to={getHomePathForRole(user?.role)} replace />
  }

  return <Outlet />
}
