import { appendTenantQuery, setDevTenantSlug } from '../utils/tenantDevContext'
import { isPlatformSuperAdmin } from '../utils/authIdentity'
import {
  canAccessRoute,
  getDashboardNavPath as getDashboardNavPathFromPermissions,
  getDefaultHomePath,
} from './routePermissions'

export function isClientUser(user, roles = []) {
  if (user?.client_id) {
    return true
  }

  return roles.some((role) => role.slug === 'client_extern')
}

function syncTenantDevContext(user) {
  if (user?.tenant?.subdomain) {
    setDevTenantSlug(user.tenant.subdomain)
  }
}

/** Default landing path after login (preserves local ?tenant= context). */
export function getHomePathForRole(role, user, roles = [], permissions = []) {
  syncTenantDevContext(user)

  return getDefaultHomePath(user, roles, permissions)
}

/** Prefer API-provided redirect after login/bootstrap. */
export function resolveRedirectPath(context) {
  if (context?.tenant?.subdomain) {
    setDevTenantSlug(context.tenant.subdomain)
  }

  if (context?.redirect_to) {
    return context.redirect_to
  }

  return getHomePathForRole(
    context?.user?.role,
    context?.user,
    context?.roles,
    context?.permissions,
  )
}

/** Dashboard nav target (always the dashboard route for ERP users). */
export function getDashboardNavPath(user, roles = []) {
  return getDashboardNavPathFromPermissions(user, roles)
}

/** Append tenant query to in-app routes for tenant users. */
export function resolveNavPath(path, user) {
  if (isPlatformSuperAdmin(user)) {
    return path
  }

  return appendTenantQuery(path)
}

export const CLIENT_ROUTE_PREFIXES = ['/portal']

export function isClientOnlyPath(pathname) {
  return CLIENT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export const SUPER_ADMIN_ROUTE_PREFIXES = ['/super-admin']

export function isSuperAdminOnlyPath(pathname) {
  return SUPER_ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Entity-scoped admin routes that platform super admins must not access. */
export function isEntityBoundAdminPath(pathname) {
  if (pathname.startsWith('/super-admin')) {
    return false
  }

  return pathname === '/discussions' || pathname.startsWith('/discussions/')
}

/** @deprecated Use canAccessRoute with permissions instead. */
export function isAdminOnlyPath(pathname) {
  return !canAccessRoute(pathname, {
    user: { role: 'user' },
    roles: [],
    permissions: [],
    isAdmin: false,
    isSuperAdmin: false,
  })
}

export { canAccessRoute, getDefaultHomePath, navItemVisible } from './routePermissions'
