const STORAGE_KEY = 'btp-daily-schedule'
const STORAGE_VERSION_KEY = 'btp-daily-schedule-version'
const CURRENT_VERSION = '3'
export const DAILY_SCHEDULE_EVENT = 'btp-daily-schedule-updated'

export const SCHEDULE_TAG_OPTIONS = [
  { id: 'chantier', color: 'bg-teal-500/20 text-teal-300' },
  { id: 'validation', color: 'bg-violet-500/20 text-violet-300' },
  { id: 'inspection', color: 'bg-blue-500/20 text-blue-300' },
  { id: 'finance', color: 'bg-amber-500/20 text-amber-300' },
]

/** @typedef {{ id: string, time: string, title: string, tag: string }} DailyScheduleItem */

/** @type {DailyScheduleItem[]} */
export const SEED_DAILY_SCHEDULE = [
  { id: 'evt-1', time: '09:00', title: 'Visite chantier — Villa California (Amine Alami)', tag: 'inspection' },
  { id: 'evt-2', time: '11:30', title: 'Réunion de coordination — Société Al Omrane Casablanca', tag: 'chantier' },
  { id: 'evt-3', time: '14:30', title: 'Point d\'avancement Boulevard Panoramique (Yassine Mansouri)', tag: 'validation' },
  { id: 'evt-4', time: '16:15', title: 'Relance facture FACT-2026-007 — Direction des Routes', tag: 'finance' },
  { id: 'evt-5', time: '10:00', title: 'Contrôle pose dalles — Corniche Malabata, Tanger (Yassine Mansouri)', tag: 'inspection' },
  { id: 'evt-6', time: '15:00', title: 'Réunion client — Club House Palmeraie Golf, Marrakech', tag: 'chantier' },
]

function createItemId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function notifyListeners() {
  window.dispatchEvent(new CustomEvent(DAILY_SCHEDULE_EVENT))
}

/** @returns {DailyScheduleItem[]} */
export function readDailySchedule() {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      writeDailySchedule(SEED_DAILY_SCHEDULE)
      return [...SEED_DAILY_SCHEDULE]
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      writeDailySchedule(SEED_DAILY_SCHEDULE)
      return [...SEED_DAILY_SCHEDULE]
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      writeDailySchedule(SEED_DAILY_SCHEDULE)
      return [...SEED_DAILY_SCHEDULE]
    }

    return parsed
  } catch {
    writeDailySchedule(SEED_DAILY_SCHEDULE)
    return [...SEED_DAILY_SCHEDULE]
  }
}

/** @param {DailyScheduleItem[]} items */
export function writeDailySchedule(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  notifyListeners()
}

/**
 * @param {Omit<DailyScheduleItem, 'id'> & { id?: string }} item
 * @returns {DailyScheduleItem}
 */
export function addDailyScheduleItem(item) {
  const items = readDailySchedule()
  const record = {
    id: item.id ?? createItemId(),
    time: item.time,
    title: item.title.trim(),
    tag: item.tag,
  }

  items.push(record)
  items.sort((a, b) => a.time.localeCompare(b.time))
  writeDailySchedule(items)
  return record
}

/**
 * @param {string} id
 * @param {Partial<Omit<DailyScheduleItem, 'id'>>} patch
 */
export function updateDailyScheduleItem(id, patch) {
  const items = readDailySchedule()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return null

  const updated = {
    ...items[index],
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : items[index].title,
  }

  items[index] = updated
  items.sort((a, b) => a.time.localeCompare(b.time))
  writeDailySchedule(items)
  return updated
}

/** @param {string} id */
export function removeDailyScheduleItem(id) {
  const items = readDailySchedule()
  const removed = items.find((item) => item.id === id) ?? null
  const next = items.filter((item) => item.id !== id)
  writeDailySchedule(next)
  return removed
}

export function tagColorFor(tag) {
  return SCHEDULE_TAG_OPTIONS.find((option) => option.id === tag)?.color ?? 'bg-slate-500/20 text-slate-300'
}
