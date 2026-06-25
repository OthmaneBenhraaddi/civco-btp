/**
 * @typedef {'en_cours' | 'termine' | 'bloque' | 'non_commence'} TaskStatut
 */

/**
 * @typedef {'haute' | 'moyenne' | 'basse'} TaskPriorite
 */

/**
 * @typedef {Object} TaskResponsable
 * @property {string} name
 * @property {string} avatarUrl
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} projectId
 * @property {string} projectName
 * @property {string} nom
 * @property {TaskResponsable} responsable
 * @property {TaskStatut} statut
 * @property {string} echeance ISO date (YYYY-MM-DD)
 * @property {TaskPriorite} priorite
 * @property {number} budget
 * @property {string[]} fichiers
 * @property {string} notes
 * @property {string} lastUpdatedBy
 * @property {string} lastUpdatedAt
 */

/** @type {TaskStatut[]} */
export const TASK_STATUTS = ['en_cours', 'termine', 'bloque', 'non_commence']

/** @type {TaskPriorite[]} */
export const TASK_PRIORITES = ['haute', 'moyenne', 'basse']

export const STATUT_I18N_KEY = {
  en_cours: 'working',
  termine: 'done',
  bloque: 'stuck',
  non_commence: 'not_started',
}

export const PRIORITE_I18N_KEY = {
  haute: 'high',
  moyenne: 'medium',
  basse: 'low',
}

export const STATUT_STRIP_COLORS = {
  en_cours: 'border-l-amber-500',
  termine: 'border-l-emerald-500',
  bloque: 'border-l-rose-500',
  non_commence: 'border-l-zinc-600',
}

export const STATUT_CALENDAR_COLORS = {
  en_cours: 'bg-amber-600/90 text-white',
  termine: 'bg-emerald-600/90 text-white',
  bloque: 'bg-rose-600/90 text-white',
  non_commence: 'bg-zinc-700 text-zinc-200',
}

export const STATUT_FILTER_MAP = {
  '': null,
  working: 'en_cours',
  done: 'termine',
  stuck: 'bloque',
  not_started: 'non_commence',
}
