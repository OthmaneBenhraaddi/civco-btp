/**
 * Platform super admin: global operator with no tenant assignment.
 */
export function isPlatformSuperAdmin(user) {
  return user != null && user.tenant_id == null && user.is_super_admin === true
}

/**
 * True when the session user belongs to the active ?tenant= dev context.
 */
export function sessionMatchesTenantContext(user, tenant, activeTenantSlug) {
  if (!activeTenantSlug) {
    return true
  }

  if (isPlatformSuperAdmin(user)) {
    return false
  }

  return tenant?.subdomain === activeTenantSlug
}

export function resolveProfileRoleLabel(user, roles, t) {
  if (user?.job_title) {
    return user.job_title
  }

  if (roles?.[0]?.name) {
    return roles[0].name
  }

  if (isPlatformSuperAdmin(user)) {
    return t('layout.profileRoleSuperAdmin')
  }

  if (user?.role === 'admin') {
    return t('layout.profileRoleAdmin')
  }

  return t('layout.profileRoleMember')
}
