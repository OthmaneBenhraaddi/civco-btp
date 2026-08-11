import { appendTenantQuery } from '../utils/tenantDevContext'
import { isPlatformSuperAdmin } from '../utils/authIdentity'
import { userHasAnyPermission, userHasPermission } from '../utils/permissionResolver'

const TASK_ROUTE_PERMISSIONS = ['project.view', 'task.view_all', 'task.view_own', 'manage_tasks']

const ERP_ROUTE_RULES = [
  { prefix: '/clients', permission: 'client.view' },
  { prefix: '/quotes', permission: 'quote.view' },
  { prefix: '/delivery-forms', permission: 'delivery_form.view' },
  { prefix: '/invoices', permission: 'invoice.view' },
  { prefix: '/projects', permission: 'project.view' },
  { prefix: '/map', permission: 'project.view' },
  { prefix: '/tasks', anyPermissions: TASK_ROUTE_PERMISSIONS },
  { prefix: '/roles', permission: 'role.view' },
  { prefix: '/discussions', entityBound: true },
  { prefix: '/history', adminOnly: true },
  { prefix: '/configuration', adminOnly: true },
  { prefix: '/team', tenantAdminOnly: true },
  { prefix: '/profile' },
]

function canViewPlatformSuperAdminNav(user) {
  return user != null && user.tenant_id === null && user.is_super_admin === true
}

function matchesPrefix(pathname, prefix, exact = false) {
  if (exact) {
    return pathname === prefix
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function findRouteRule(pathname) {
  if (pathname === '/' || pathname === '') {
    return { prefix: '/', permission: 'dashboard.view', exact: true }
  }

  const sorted = [...ERP_ROUTE_RULES].sort((a, b) => b.prefix.length - a.prefix.length)

  return sorted.find((rule) => matchesPrefix(pathname, rule.prefix)) ?? null
}

/** @param {string} pathname @param {object} ctx */
export function canAccessRoute(pathname, ctx) {
  const { user, roles = [], permissions = [], isAdmin, isSuperAdmin } = ctx

  if (pathname.startsWith('/portal')) {
    return roles.some((role) => role.slug === 'client_extern') || Boolean(user?.client_id)
  }

  if (pathname.startsWith('/super-admin')) {
    return isSuperAdmin || canViewPlatformSuperAdminNav(user)
  }
  if (pathname === '/login') {
    return true
  }

  const rule = findRouteRule(pathname)

  if (!rule) {
    return true
  }

  if (rule.entityBound) {
    return Boolean(user?.tenant_id) && !canViewPlatformSuperAdminNav(user)
  }

  if (rule.tenantAdminOnly) {
    return isAdmin && (Boolean(user?.tenant_id) || canViewPlatformSuperAdminNav(user))
  }

  if (rule.adminOnly) {
    return isAdmin
  }

  if (rule.permission) {
    return userHasPermission(permissions, rule.permission)
  }

  if (rule.anyPermissions) {
    return userHasAnyPermission(permissions, rule.anyPermissions)
  }

  return true
}

export function getDefaultHomePath(user, roles = [], permissions = []) {
  if (roles.some((role) => role.slug === 'client_extern') || user?.client_id) {
    return appendTenantQuery('/portal')
  }

  if (isPlatformSuperAdmin(user)) {
    return '/super-admin/overview'
  }

  if (user?.role === 'admin') {
    return appendTenantQuery('/')
  }

  if (userHasPermission(permissions, 'project.view')) {
    return appendTenantQuery('/projects')
  }

  if (userHasPermission(permissions, 'invoice.view')) {
    return appendTenantQuery('/invoices')
  }

  if (userHasPermission(permissions, 'quote.view')) {
    return appendTenantQuery('/quotes')
  }

  if (userHasPermission(permissions, 'client.view')) {
    return appendTenantQuery('/clients')
  }

  if (userHasPermission(permissions, 'dashboard.view')) {
    return appendTenantQuery('/')
  }

  return appendTenantQuery('/')
}

export function getDashboardNavPath(user, roles = []) {
  if (isPlatformSuperAdmin(user)) {
    return '/'
  }

  if (roles.some((role) => role.slug === 'client_extern') || user?.client_id) {
    return '/portal'
  }

  return appendTenantQuery('/')
}

export function navItemVisible(item, ctx) {
  const { isClientPortalUser, isAdmin, user, hasPermission } = ctx

  if (item.platformSuperAdminOnly) {
    return canViewPlatformSuperAdminNav(user)
  }

  if (isClientPortalUser) {
    return item.audience === 'client'
  }

  if (item.audience === 'client') {
    return false
  }

  if (item.entityBoundStaffOnly) {
    return Boolean(user?.tenant_id) && !canViewPlatformSuperAdminNav(user)
  }

  if (item.entityBoundAdminOnly) {
    return isAdmin && Boolean(user?.tenant_id) && !canViewPlatformSuperAdminNav(user)
  }

  if (item.tenantAdminOnly) {
    return isAdmin && (Boolean(user?.tenant_id) || canViewPlatformSuperAdminNav(user))
  }

  if (item.adminOnly && !isAdmin) {
    return false
  }

  if (item.permission && !hasPermission(item.permission)) {
    return false
  }

  if (item.anyPermissions && !item.anyPermissions.some((permission) => hasPermission(permission))) {
    return false
  }

  return item.audience === 'erp'
}
