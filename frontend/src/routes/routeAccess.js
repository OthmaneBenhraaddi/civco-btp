/** Default landing path after login, by account role. */
export function getHomePathForRole(role) {
  return role === 'admin' ? '/' : '/projects'
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
]

export function isAdminOnlyPath(pathname) {
  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
