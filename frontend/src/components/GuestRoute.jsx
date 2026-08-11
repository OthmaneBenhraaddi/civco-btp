import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getHomePathForRole } from '../routes/routeAccess'

export default function GuestRoute() {
  const { isAuthenticated, loading, user, roles, permissions } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-[#0D0E11]">
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles, permissions)} replace />
  }

  return <Outlet />
}
