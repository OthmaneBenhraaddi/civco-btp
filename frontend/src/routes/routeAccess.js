import { appendTenantQuery, setDevTenantSlug } from '../utils/tenantDevContext'
import { isPlatformSuperAdmin } from '../utils/authIdentity'

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
export function getHomePathForRole(role, user, roles = []) {
  syncTenantDevContext(user)

  let path

  if (isClientUser(user, roles)) {
    path = '/portal'
  } else if (isPlatformSuperAdmin(user)) {
    path = '/super-admin'
  } else {
    path = role === 'admin' ? '/' : '/projects'
  }

  if (isPlatformSuperAdmin(user)) {
    return path
  }

  return appendTenantQuery(path)
}

/** Prefer API-provided redirect after login/bootstrap. */
export function resolveRedirectPath(context) {
  if (context?.tenant?.subdomain) {
    setDevTenantSlug(context.tenant.subdomain)
  }

  if (context?.redirect_to) {
    return context.redirect_to
  }

  return getHomePathForRole(context?.user?.role, context?.user, context?.roles)
}

/** Dashboard nav target (may differ from post-login home for super admins). */
export function getDashboardNavPath(user, roles = []) {
  if (isPlatformSuperAdmin(user)) {
    return '/'
  }

  return getHomePathForRole(user?.role, user, roles)
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

/** Route prefixes reserved for administrators (team members are redirected). */
export const ADMIN_ROUTE_PREFIXES = [
  '/clients',
  '/quotes',
  '/delivery-forms',
  '/invoices',
  '/history',
  '/roles',
  '/configuration',
  '/team',
  '/discussions',
]

export const SUPER_ADMIN_ROUTE_PREFIXES = ['/super-admin']

export function isAdminOnlyPath(pathname) {
  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function isSuperAdminOnlyPath(pathname) {
  return SUPER_ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Entity-scoped admin routes that platform super admins must not access. */
export function isEntityBoundAdminPath(pathname) {
  return pathname === '/discussions' || pathname.startsWith('/discussions/')
}

/** Team members should not access internal routes when they are client portal users. */
export function isTeamRoute(pathname) {
  if (isClientOnlyPath(pathname) || pathname === '/login') {
    return false
  }

  return !isAdminOnlyPath(pathname) || pathname === '/'
}
