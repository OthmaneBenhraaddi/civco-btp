export const GLOBAL_NAV_ROUTES = [
  {
    id: 'dashboard',
    path: '/',
    labelKey: 'nav.dashboard',
    keywords: ['dashboard', 'tableau', 'bord', 'accueil', 'home'],
  },
  {
    id: 'tasks',
    path: '/tasks',
    labelKey: 'nav.tasks',
    keywords: ['tache', 'tâche', 'tâches', 'task', 'tasks'],
  },
  {
    id: 'clients',
    path: '/clients',
    labelKey: 'nav.clients',
    keywords: ['client', 'clients'],
    adminOnly: true,
  },
  {
    id: 'projects',
    path: '/projects',
    labelKey: 'nav.projects',
    keywords: ['projet', 'projets', 'project', 'projects', 'chantier', 'chantiers'],
  },
  {
    id: 'quotes',
    path: '/quotes',
    labelKey: 'nav.quotes',
    keywords: ['devis', 'quote', 'quotes'],
    adminOnly: true,
  },
  {
    id: 'delivery-forms',
    path: '/delivery-forms',
    labelKey: 'nav.deliveryForms',
    keywords: ['bon de livraison', 'bons de livraison', 'delivery', 'bl', 'livraison'],
    adminOnly: true,
  },
  {
    id: 'invoices',
    path: '/invoices',
    labelKey: 'nav.invoices',
    keywords: ['facture', 'factures', 'invoice', 'invoices'],
    adminOnly: true,
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

function visibleRoutes(isAdmin) {
  return GLOBAL_NAV_ROUTES.filter((route) => !route.adminOnly || isAdmin)
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

export function getRecommendedRoutes(t, isAdmin = true) {
  return visibleRoutes(isAdmin).map((route) => toNavResult(route, t))
}

export function findNavRoutes(query, t, isAdmin = true) {
  return visibleRoutes(isAdmin)
    .filter((route) => matchesNavRoute(query, route.keywords))
    .map((route) => toNavResult(route, t))
}
