const now = Date.now()

/** @typedef {'creation' | 'modification' | 'suppression'} DemoLogAction */
/** @typedef {'created' | 'updated' | 'deleted'} DemoActionType */

/**
 * Demo activity logs spanning all tenants for Super Admin presentation.
 * Shape aligned with tenant HistoryLog API items + tenant_slug for filtering.
 */
export const SUPER_ADMIN_LOG_ENTITIES = [
  { slug: '', labelKey: 'superAdmin.logs.filters.allEntities' },
  { slug: 'civco', labelKey: 'superAdmin.logs.entities.civco' },
  { slug: 'eebb', labelKey: 'superAdmin.logs.entities.eebb' },
  { slug: 'atlas', labelKey: 'superAdmin.logs.entities.atlas' },
]

export const SUPER_ADMIN_DEMO_LOGS = [
  {
    id: 'sa-log-001',
    tenant_slug: 'system',
    tenant_name: 'Plateforme',
    user_id: 'superadmin',
    actor: 'Super Admin',
    project_id: '',
    project_reference: '',
    project_title: '',
    action: 'creation',
    action_type: 'created',
    message: 'Sauvegarde automatique de la base de données réussie.',
    timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'sa-log-002',
    tenant_slug: 'civco',
    tenant_name: 'CivCo BTP',
    user_id: 'admin-civco',
    actor: 'Karim Benjelloun',
    project_id: 'civco-p1',
    project_reference: 'CIV-2024-01',
    project_title: 'Lotissement California — VRD',
    action: 'creation',
    action_type: 'created',
    message: 'Création réussie de l\'entité « CivCo BTP » et provisionnement du sous-domaine civco.',
    timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'sa-log-003',
    tenant_slug: 'atlas',
    tenant_name: 'Atlas Construction',
    user_id: 'admin-atlas',
    actor: 'Samira Bennani',
    project_id: 'atlas-p1',
    project_reference: 'ATL-2025-03',
    project_title: 'Résidence Anfa Horizon',
    action: 'modification',
    action_type: 'updated',
    message: 'Mise à jour des informations de l\'entité « Atlas Construction ».',
    timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'sa-log-004',
    tenant_slug: 'system',
    tenant_name: 'Plateforme',
    user_id: 'superadmin',
    actor: 'Super Admin',
    project_id: '',
    project_reference: '',
    project_title: '',
    action: 'creation',
    action_type: 'created',
    message: 'Initialisation du compte Global Super Admin.',
    timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'sa-log-005',
    tenant_slug: 'eebb',
    tenant_name: 'EEBB',
    user_id: 'admin-eebb',
    actor: 'Nadia El Fassi',
    project_id: 'eebb-p1',
    project_reference: 'EEB-2024-12',
    project_title: 'Extension Zone Industrielle Zenata',
    action: 'modification',
    action_type: 'updated',
    message: 'A mis à jour l\'avancement du projet Extension Zone Industrielle Zenata à 68 %.',
    timestamp: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'sa-log-006',
    tenant_slug: 'civco',
    tenant_name: 'CivCo BTP',
    user_id: 'chantier-civco',
    actor: 'Yassine Mansouri',
    project_id: 'civco-p1',
    project_reference: 'CIV-2024-01',
    project_title: 'Lotissement California — VRD',
    action: 'modification',
    action_type: 'updated',
    message: 'A enregistré une nouvelle saisie d\'avancement chantier sur le lotissement California.',
    timestamp: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'sa-log-007',
    tenant_slug: 'atlas',
    tenant_name: 'Atlas Construction',
    user_id: 'ingenieur-atlas',
    actor: 'Driss Hamdaoui',
    project_id: 'atlas-p2',
    project_reference: 'ATL-2025-01',
    project_title: 'Centre Commercial Anfa Place',
    action: 'creation',
    action_type: 'created',
    message: 'A créé la phase « Gros œuvre » sur le projet Centre Commercial Anfa Place.',
    timestamp: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: 'sa-log-008',
    tenant_slug: 'system',
    tenant_name: 'Plateforme',
    user_id: 'superadmin',
    actor: 'Super Admin',
    project_id: '',
    project_reference: '',
    project_title: '',
    action: 'modification',
    action_type: 'updated',
    message: 'Synchronisation des métriques plateforme terminée.',
    timestamp: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'sa-log-009',
    tenant_slug: 'eebb',
    tenant_name: 'EEBB',
    user_id: 'compta-eebb',
    actor: 'Hassan Ouazzani',
    project_id: 'eebb-p2',
    project_reference: 'EEB-2025-02',
    project_title: 'Voirie Lotissement Bouskoura',
    action: 'creation',
    action_type: 'created',
    message: 'A émis la facture FAC-2025-014 pour le client promoteur Bouskoura Développement.',
    timestamp: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'sa-log-010',
    tenant_slug: 'civco',
    tenant_name: 'CivCo BTP',
    user_id: 'compta-civco',
    actor: 'Salma Idrissi',
    project_id: 'civco-p2',
    project_reference: 'CIV-2025-02',
    project_title: 'Promenade Corniche Malabata',
    action: 'creation',
    action_type: 'created',
    message: 'A validé le devis DEV-2025-089 pour la Promenade Corniche Malabata.',
    timestamp: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'sa-log-011',
    tenant_slug: 'atlas',
    tenant_name: 'Atlas Construction',
    user_id: 'admin-atlas',
    actor: 'Samira Bennani',
    project_id: 'atlas-p1',
    project_reference: 'ATL-2025-03',
    project_title: 'Résidence Anfa Horizon',
    action: 'suppression',
    action_type: 'deleted',
    message: 'A archivé le document provisoire « Plan masse v0 » du projet Résidence Anfa Horizon.',
    timestamp: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: 'sa-log-012',
    tenant_slug: 'eebb',
    tenant_name: 'EEBB',
    user_id: 'ingenieur-eebb',
    actor: 'Laila Chraibi',
    project_id: 'eebb-p1',
    project_reference: 'EEB-2024-12',
    project_title: 'Extension Zone Industrielle Zenata',
    action: 'modification',
    action_type: 'updated',
    message: 'A réassigné la tâche « Contrôle qualité béton » à Mehdi Ziani.',
    timestamp: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
  },
  {
    id: 'sa-log-013',
    tenant_slug: 'civco',
    tenant_name: 'CivCo BTP',
    user_id: 'ingenieur-civco',
    actor: 'Amine Alami',
    project_id: 'civco-p1',
    project_reference: 'CIV-2024-01',
    project_title: 'Lotissement California — VRD',
    action: 'modification',
    action_type: 'updated',
    message: 'A validé le coulage dalle RDC — club house Palmeraie Golf, Marrakech.',
    timestamp: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'sa-log-014',
    tenant_slug: 'atlas',
    tenant_name: 'Atlas Construction',
    user_id: 'tech-atlas',
    actor: 'Amina Rguibi',
    project_id: 'atlas-p2',
    project_reference: 'ATL-2025-01',
    project_title: 'Centre Commercial Anfa Place',
    action: 'modification',
    action_type: 'updated',
    message: 'A mis à jour l\'avancement de la tâche « Installation CVC » à 45 %.',
    timestamp: new Date(now - 1000 * 60 * 60 * 40).toISOString(),
  },
]

export const SUPER_ADMIN_LOGS_PER_PAGE = 8

export function filterSuperAdminLogs(logs, filters) {
  return logs.filter((log) => {
    if (filters.tenant_slug && log.tenant_slug !== filters.tenant_slug) {
      return false
    }

    if (filters.user_id && log.user_id !== filters.user_id) {
      return false
    }

    if (filters.project_id && log.project_id !== filters.project_id) {
      return false
    }

    if (filters.action_type && log.action_type !== filters.action_type) {
      return false
    }

    return true
  })
}

export function getSuperAdminFilterOptions(logs) {
  const users = new Map()
  const projects = new Map()

  for (const log of logs) {
    if (log.user_id && log.actor) {
      users.set(log.user_id, log.actor)
    }

    if (log.project_id && log.project_title) {
      projects.set(log.project_id, {
        id: log.project_id,
        reference: log.project_reference,
        title: log.project_title,
      })
    }
  }

  return {
    users: [...users.entries()].map(([id, name]) => ({ id, name })),
    projects: [...projects.values()],
  }
}
