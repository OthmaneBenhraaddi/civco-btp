import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getHomePathForRole } from '../routes/routeAccess'

export default function SuperAdminRoute() {
  const { isSuperAdmin, user, roles, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0b0c0e] text-slate-400">
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles)} replace />
  }

  return <Outlet />
}
