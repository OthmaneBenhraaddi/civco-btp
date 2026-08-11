import { buildAvatarUrl, formatLastUpdatedAt } from './taskUtils'

const API_STATUS_TO_UI = {
  todo: 'non_commence',
  in_progress: 'en_cours',
  done: 'termine',
  blocked: 'bloque',
}

export const UI_STATUS_TO_API = {
  non_commence: 'todo',
  en_cours: 'in_progress',
  termine: 'done',
  bloque: 'blocked',
}

function inferPriority(apiTask) {
  if (apiTask.status === 'blocked') {
    return 'haute'
  }

  if (apiTask.status === 'in_progress') {
    return 'moyenne'
  }

  if (apiTask.status === 'done') {
    return 'basse'
  }

  return 'moyenne'
}

/** @param {object} apiTask @param {object} project */
export function mapApiTaskToUiTask(apiTask, project, locale = 'fr') {
  const assigneeName = apiTask.assigned_to?.full_name ?? '—'
  const updatedAt = apiTask.completed_at ?? apiTask.due_date ?? new Date().toISOString()

  return {
    id: String(apiTask.id),
    projectId: String(project.id),
    projectName: project.title,
    assignedToUserId: apiTask.assigned_to?.id ?? apiTask.assigned_to_user_id ?? null,
    nom: apiTask.title,
    responsable: {
      name: assigneeName,
      avatarUrl: buildAvatarUrl(assigneeName),
    },
    statut: API_STATUS_TO_UI[apiTask.status] ?? 'non_commence',
    echeance: apiTask.due_date ?? '',
    priorite: inferPriority(apiTask),
    budget: 0,
    fichiers: [],
    notes: apiTask.description ?? '',
    lastUpdatedBy: assigneeName,
    lastUpdatedAt: formatLastUpdatedAt(new Date(updatedAt), locale),
  }
}

/** @param {object[]} projects */
export function mapPhasesResponseToTasks(phases, project, locale = 'fr') {
  return phases.flatMap((phase) =>
    (phase.tasks ?? []).map((task) => mapApiTaskToUiTask(task, project, locale)),
  )
}
