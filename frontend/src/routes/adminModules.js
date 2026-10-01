export const ADMIN_MODULES = [
  { id: 'chantier', labelKey: 'nav.modules.chantier' },
  { id: 'commercial', labelKey: 'nav.modules.commercial' },
  { id: 'support', labelKey: 'nav.modules.support' },
]

const MODULE_PREFIXES = {
  chantier: ['/projects', '/tasks', '/documents'],
  commercial: ['/clients', '/quotes', '/delivery-forms', '/invoices'],
  support: ['/tickets'],
}

export function adminModuleAllows(user, moduleId) {
  if (!user || user.role !== 'admin' || user.tenant_id == null || user.is_super_admin) {
    return true
  }

  if (user.enabled_modules == null) {
    return true
  }

  return user.enabled_modules.includes(moduleId)
}

export function moduleForPath(pathname) {
  const match = Object.entries(MODULE_PREFIXES)
    .flatMap(([moduleId, prefixes]) => prefixes.map((prefix) => ({ moduleId, prefix })))
    .sort((left, right) => right.prefix.length - left.prefix.length)
    .find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  return match?.moduleId ?? null
}
