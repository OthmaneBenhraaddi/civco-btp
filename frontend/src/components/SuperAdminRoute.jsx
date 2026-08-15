import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getHomePathForRole } from '../routes/routeAccess'
import { isPlatformSuperAdmin } from '../utils/authIdentity'

function canAccessSuperAdminArea(user) {
  return isPlatformSuperAdmin(user) || user?.is_super_admin === true
}

export default function SuperAdminRoute() {
  const { user, roles, permissions, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0b0f17] text-slate-400">
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    )
  }

  if (!canAccessSuperAdminArea(user)) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles, permissions)} replace />
  }

  return <Outlet />
}
