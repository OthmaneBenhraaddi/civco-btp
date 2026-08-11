import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { appendTenantQuery } from '../utils/tenantDevContext'
import { isPlatformSuperAdmin } from '../utils/authIdentity'
import {
  canAccessRoute,
  getHomePathForRole,
  isClientOnlyPath,
  isClientUser,
  isEntityBoundAdminPath,
  isSuperAdminOnlyPath,
} from '../routes/routeAccess'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, isAdmin, isSuperAdmin, user, roles, permissions } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  const routeContext = { user, roles, permissions, isAdmin, isSuperAdmin }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-[#0b0c0e] text-slate-400">
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={appendTenantQuery('/login')} replace state={{ from: location.pathname }} />
  }

  const clientUser = isClientUser(user, roles)

  if (clientUser && !isClientOnlyPath(location.pathname)) {
    return <Navigate to="/portal" replace />
  }

  if (!clientUser && isClientOnlyPath(location.pathname)) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles, permissions)} replace />
  }

  if (!canAccessRoute(location.pathname, routeContext)) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles, permissions)} replace />
  }

  if (!isSuperAdmin && isSuperAdminOnlyPath(location.pathname)) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles, permissions)} replace />
  }

  if (isPlatformSuperAdmin(user) && location.pathname === '/team') {
    return <Navigate to="/super-admin/members" replace />
  }

  if (isPlatformSuperAdmin(user) && isEntityBoundAdminPath(location.pathname)) {
    return <Navigate to="/super-admin/overview" replace />
  }

  return <Outlet />
}
