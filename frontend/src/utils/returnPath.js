import { appendTenantQuery } from './tenantDevContext'

/**
 * Safe in-app path to restore after login / session bounce.
 * Rejects absolute URLs and the login route itself.
 */
export function getSafeReturnPath(from, fallback = '/') {
  const safeFallback =
    typeof fallback === 'string' && fallback.startsWith('/') && !fallback.startsWith('//')
      ? fallback
      : appendTenantQuery('/')

  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return safeFallback
  }

  const pathOnly = from.split('?')[0].split('#')[0]
  if (pathOnly === '/login') {
    return safeFallback
  }

  return appendTenantQuery(from)
}

export function locationToReturnPath(location) {
  if (!location?.pathname) {
    return '/'
  }

  return `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`
}
