/** Frontend workspace entry URL for a tenant (local ?tenant= or production subdomain). */
export function buildTenantWorkspaceUrl(subdomain, apiWorkspaceUrl) {
  if (apiWorkspaceUrl) {
    return apiWorkspaceUrl
  }

  if (!subdomain) {
    return '/login'
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/login?tenant=${encodeURIComponent(subdomain)}`
}
