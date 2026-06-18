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
  },
  {
    id: 'invoices',
    path: '/invoices',
    labelKey: 'nav.invoices',
    keywords: ['facture', 'factures', 'invoice', 'invoices'],
  },
  {
    id: 'roles',
    path: '/roles',
    labelKey: 'nav.roles',
    keywords: ['role', 'roles', 'droits', 'access'],
  },
  {
    id: 'history',
    path: '/history',
    labelKey: 'nav.history',
    keywords: ['historique', 'history', 'journal', 'audit', 'activité', 'activity', 'log'],
  },
]

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

export function getRecommendedRoutes(t) {
  return GLOBAL_NAV_ROUTES.map((route) => toNavResult(route, t))
}

export function findNavRoutes(query, t) {
  return GLOBAL_NAV_ROUTES
    .filter((route) => matchesNavRoute(query, route.keywords))
    .map((route) => toNavResult(route, t))
}
