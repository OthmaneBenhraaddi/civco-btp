import { navItemVisible } from '../routes/routePermissions'

export const GLOBAL_NAV_ROUTES = [
  {
    id: 'dashboard',
    path: '/',
    labelKey: 'nav.dashboard',
    keywords: ['dashboard', 'tableau', 'bord', 'accueil', 'home'],
    permission: 'dashboard.view',
  },
  {
    id: 'tasks',
    path: '/tasks',
    labelKey: 'nav.tasks',
    keywords: ['tache', 'tâche', 'tâches', 'task', 'tasks'],
    anyPermissions: ['project.view', 'task.view_all', 'task.view_own', 'manage_tasks'],
  },
  {
    id: 'clients',
    path: '/clients',
    labelKey: 'nav.clients',
    keywords: ['client', 'clients'],
    permission: 'client.view',
  },
  {
    id: 'projects',
    path: '/projects',
    labelKey: 'nav.projects',
    keywords: ['projet', 'projets', 'project', 'projects', 'chantier', 'chantiers'],
    permission: 'project.view',
  },
  {
    id: 'map',
    path: '/map',
    labelKey: 'nav.map',
    keywords: ['carte', 'map', 'chantier', 'carte des chantiers'],
    permission: 'project.view',
  },
  {
    id: 'quotes',
    path: '/quotes',
    labelKey: 'nav.quotes',
    keywords: ['devis', 'quote', 'quotes'],
    permission: 'quote.view',
  },
  {
    id: 'delivery-forms',
    path: '/delivery-forms',
    labelKey: 'nav.deliveryForms',
    keywords: ['bon de livraison', 'bons de livraison', 'delivery', 'bl', 'livraison'],
    permission: 'delivery_form.view',
  },
  {
    id: 'invoices',
    path: '/invoices',
    labelKey: 'nav.invoices',
    keywords: ['facture', 'factures', 'invoice', 'invoices'],
    permission: 'invoice.view',
  },
  {
    id: 'super-admin-overview',
    path: '/super-admin/overview',
    labelKey: 'nav.superAdminOverview',
    keywords: ['vue', 'overview', 'statistiques', 'statistics', 'kpi'],
    platformSuperAdminOnly: true,
  },
  {
    id: 'super-admin-entities',
    path: '/super-admin/entities',
    labelKey: 'nav.superAdminEntities',
    keywords: ['entités', 'entities', 'tenant', 'tenants', 'atlas', 'civco', 'eebb'],
    platformSuperAdminOnly: true,
  },
  {
    id: 'super-admin-create',
    path: '/super-admin/create',
    labelKey: 'nav.superAdminCreate',
    keywords: ['créer', 'create', 'nouvelle entité', 'provision'],
    platformSuperAdminOnly: true,
  },
  {
    id: 'super-admin-members',
    path: '/super-admin/members',
    labelKey: 'nav.superAdminMembers',
    keywords: ['membres', 'members', 'utilisateurs', 'users', 'accès', 'access', 'équipe', 'team'],
    platformSuperAdminOnly: true,
  },
  {
    id: 'super-admin-logs',
    path: '/super-admin/logs',
    labelKey: 'nav.superAdminLogs',
    keywords: ['logs', 'journal', 'système', 'system', 'audit'],
    platformSuperAdminOnly: true,
  },
  {
    id: 'team',
    path: '/team',
    labelKey: 'nav.team',
    keywords: ['équipe', 'team', 'membre', 'technicien', 'comptable', 'utilisateur'],
    tenantAdminOnly: true,
  },
  {
    id: 'profile',
    path: '/profile',
    labelKey: 'nav.profile',
    keywords: ['profil', 'profile', 'paramètres', 'settings', 'mot de passe', 'password', 'email'],
  },
  {
    id: 'configuration',
    path: '/configuration',
    labelKey: 'nav.configuration',
    keywords: ['configuration', 'settings', 'parametres', 'paramètres', 'badges', 'lots', 'couleurs', 'colors', 'role', 'roles', 'droits', 'access'],
    adminOnly: true,
  },
  {
    id: 'history',
    path: '/history',
    labelKey: 'nav.history',
    keywords: ['historique', 'history', 'journal', 'audit', 'activité', 'activity', 'log'],
    adminOnly: true,
  },
]

function visibleRoutes(authContext) {
  return GLOBAL_NAV_ROUTES.filter((route) => navItemVisible(
    { ...route, audience: 'erp' },
    authContext,
  ))
}

export function matchesNavRoute(query, keywords) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return false

  return keywords.some((keyword) => {
    const key = keyword.toLowerCase()
    return key.includes(normalized) || normalized.includes(key) || key.startsWith(normalized)
  })
}

function toNavResult(route, t) {
  return {
    id: `nav-${route.id}`,
    type: 'page',
    routeId: route.id,
    label: t(route.labelKey),
    path: route.path,
  }
}

export function getRecommendedRoutes(t, authContext) {
  return visibleRoutes(authContext).map((route) => toNavResult(route, t))
}

export function findNavRoutes(query, t, authContext) {
  return visibleRoutes(authContext)
    .filter((route) => matchesNavRoute(query, route.keywords))
    .map((route) => toNavResult(route, t))
}
