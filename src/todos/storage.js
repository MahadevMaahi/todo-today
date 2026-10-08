import { normalizeImported } from './model.js'

export const STORAGE_KEY = 'todo-today.tasks.v1'

/**
 * Session storage keeps tasks across refresh in the same tab,
 * and clears automatically when the tab/window is closed.
 * @returns {Storage | null}
 */
function defaultStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  // Scrub older localStorage copies so boards no longer persist after tab close.
  try {
    window.localStorage?.removeItem(STORAGE_KEY)
  } catch {
    // Ignore quota / privacy-mode failures.
  }
  return window.sessionStorage
}

/**
 * @param {Storage | null} [storage]
 * @returns {import('./model.js').Task[]}
 */
export function loadTasks(storage = defaultStorage()) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const tasks = normalizeImported(parsed, { keepIds: true })
    return tasks ?? []
  } catch {
    return []
  }
}

/**
 * @param {import('./model.js').Task[]} tasks
 * @param {Storage | null} [storage]
 * @returns {{ ok: boolean }}
 */
export function saveTasks(tasks, storage = defaultStorage()) {
  if (!storage) return { ok: false }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
