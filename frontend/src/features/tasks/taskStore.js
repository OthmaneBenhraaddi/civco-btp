import { SEED_TASKS } from './mockTasks'

const STORAGE_KEY = 'btp-project-tasks'
const STORAGE_VERSION_KEY = 'btp-project-tasks-version'
const CURRENT_VERSION = '2'

function isValidTask(task) {
  return task
    && typeof task.projectId === 'string'
    && typeof task.projectName === 'string'
    && typeof task.nom === 'string'
}

/** @returns {import('./types.js').Task[]} */
export function readTasks() {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      writeTasks(SEED_TASKS)
      return [...SEED_TASKS]
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      writeTasks(SEED_TASKS)
      return [...SEED_TASKS]
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.some((task) => !isValidTask(task))) {
      writeTasks(SEED_TASKS)
      return [...SEED_TASKS]
    }

    return parsed
  } catch {
    writeTasks(SEED_TASKS)
    return [...SEED_TASKS]
  }
}

/** @param {import('./types.js').Task[]} tasks */
export function writeTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
}

/** @param {import('./types.js').Task} task */
export function appendTask(task) {
  const tasks = readTasks()
  tasks.unshift(task)
  writeTasks(tasks)
  return tasks
}

/** @param {import('./types.js').Task[]} tasks */
export function replaceTasks(tasks) {
  writeTasks(tasks)
  return tasks
}
