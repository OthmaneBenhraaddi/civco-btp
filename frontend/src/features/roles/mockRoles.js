/**
 * @typedef {Object} PermissionRule
 * @property {string} id
 * @property {string} labelKey
 */

/**
 * @typedef {Object} PermissionModule
 * @property {string} id
 * @property {string} labelKey
 * @property {PermissionRule[]} permissions
 */

/**
 * @typedef {Object} SystemRole
 * @property {string} id
 * @property {string} nameKey
 * @property {string} descriptionKey
 * @property {string} badgeTone
 * @property {string[]} permissions
 */

/** @type {PermissionModule[]} */
export const PERMISSION_MODULES = [
  {
    id: 'projects',
    labelKey: 'roles.modules.projects',
    permissions: [
      { id: 'project.view', labelKey: 'roles.permissions.projectView' },
      { id: 'project.create', labelKey: 'roles.permissions.projectCreate' },
      { id: 'project.update', labelKey: 'roles.permissions.projectUpdate' },
      { id: 'project.delete', labelKey: 'roles.permissions.projectDelete' },
      { id: 'project.budget', labelKey: 'roles.permissions.projectBudget' },
    ],
  },
  {
    id: 'invoices',
    labelKey: 'roles.modules.invoices',
    permissions: [
      { id: 'quote.view', labelKey: 'roles.permissions.quoteView' },
      { id: 'quote.manage', labelKey: 'roles.permissions.quoteManage' },
      { id: 'invoice.view', labelKey: 'roles.permissions.invoiceView' },
      { id: 'invoice.manage', labelKey: 'roles.permissions.invoiceManage' },
      { id: 'payment.record', labelKey: 'roles.permissions.paymentRecord' },
    ],
  },
  {
    id: 'tasks',
    labelKey: 'roles.modules.tasks',
    permissions: [
      { id: 'task.view_all', labelKey: 'roles.permissions.taskViewAll' },
      { id: 'task.view_own', labelKey: 'roles.permissions.taskViewOwn' },
      { id: 'task.assign', labelKey: 'roles.permissions.taskAssign' },
      { id: 'task.update', labelKey: 'roles.permissions.taskUpdate' },
    ],
  },
  {
    id: 'clients',
    labelKey: 'roles.modules.clients',
    permissions: [
      { id: 'client.view', labelKey: 'roles.permissions.clientView' },
      { id: 'client.create', labelKey: 'roles.permissions.clientCreate' },
      { id: 'client.update', labelKey: 'roles.permissions.clientUpdate' },
      { id: 'client.delete', labelKey: 'roles.permissions.clientDelete' },
    ],
  },
]

/** @type {SystemRole[]} */
export const SYSTEM_ROLES = [
  {
    id: 'super_admin',
    nameKey: 'roles.list.superAdmin',
    descriptionKey: 'roles.list.superAdminDesc',
    badgeTone: 'purple',
    permissions: PERMISSION_MODULES.flatMap((module) => module.permissions.map((p) => p.id)),
  },
  {
    id: 'chef_chantier',
    nameKey: 'roles.list.siteManager',
    descriptionKey: 'roles.list.siteManagerDesc',
    badgeTone: 'sky',
    permissions: [
      'project.view', 'project.update', 'project.budget',
      'task.view_all', 'task.assign', 'task.update',
      'client.view', 'document.view',
    ],
  },
  {
    id: 'conducteur_travaux',
    nameKey: 'roles.list.worksSupervisor',
    descriptionKey: 'roles.list.worksSupervisorDesc',
    badgeTone: 'amber',
    permissions: [
      'project.view', 'project.update',
      'task.view_all', 'task.update',
      'quote.view', 'invoice.view',
    ],
  },
  {
    id: 'client_extern',
    nameKey: 'roles.list.externalClient',
    descriptionKey: 'roles.list.externalClientDesc',
    badgeTone: 'emerald',
    permissions: ['project.view', 'task.view_own', 'invoice.view'],
  },
]

export const ALL_PERMISSION_IDS = PERMISSION_MODULES.flatMap((module) =>
  module.permissions.map((permission) => permission.id),
)

export function cloneRolePermissions(roles = SYSTEM_ROLES) {
  return Object.fromEntries(roles.map((role) => [role.id, [...role.permissions]]))
}

export function getSystemRole(roleId) {
  const all = [...SYSTEM_ROLES]
  try {
    const raw = localStorage.getItem('btp-custom-roles')
    if (raw) {
      const custom = JSON.parse(raw)
      if (Array.isArray(custom)) {
        all.push(...custom)
      }
    }
  } catch {
  }

  return all.find((role) => role.id === roleId) ?? SYSTEM_ROLES[3]
}
