/**
 * @typedef {'p0' | 'p1' | 'p2' | 'p3'} Priority
 * @typedef {'backlog' | 'in_process' | 'blocked' | 'finished'} Status
 * @typedef {{
 *   id: string,
 *   ticketNumber: string,
 *   title: string,
 *   priority: Priority,
 *   status: Status,
 *   parentTaskId: string | null,
 *   objective: string,
 *   effort: number | null,
 *   linkedTaskIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }} Task
 * @typedef {{ ok: true, tasks: Task[], task?: Task } | { ok: false, reason: string, openChildTitles?: string[] }} Result
 */

export const PRIORITIES = /** @type {const} */ (['p0', 'p1', 'p2', 'p3'])

export const PRIORITY_LABELS = {
  p0: 'P0',
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
}

export const STATUSES = /** @type {const} */ ([
  'backlog',
  'in_process',
  'blocked',
  'finished',
])

export const STATUS_LABELS = {
  backlog: 'Backlog',
  in_process: 'In Process',
  blocked: 'Blocked',
  finished: 'Finished',
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * @param {unknown} ticketNumber
 * @returns {number}
 */
function parseTicketSeq(ticketNumber) {
  const match = /^TD-(\d+)$/i.exec(String(ticketNumber ?? '').trim())
  return match ? Number(match[1]) : 0
}

/**
 * Next human-readable ticket id (TD-1, TD-2, …).
 * @param {Task[]} tasks
 * @returns {string}
 */
export function nextTicketNumber(tasks) {
  let max = 0
  for (const task of tasks) {
    const n = parseTicketSeq(task.ticketNumber)
    if (n > max) max = n
  }
  return `TD-${max + 1}`
}

/**
 * Label for parent/link pickers: "TD-12 — Ship login".
 * @param {Pick<Task, 'ticketNumber' | 'title'>} task
 * @returns {string}
 */
export function formatTaskOption(task) {
  const ticket = task.ticketNumber || 'TD-?'
  return `${ticket} — ${task.title}`
}

/**
 * Assign missing ticket numbers without changing existing ones.
 * @param {Task[]} tasks
 * @returns {Task[]}
 */
function ensureTicketNumbers(tasks) {
  let max = 0
  for (const task of tasks) {
    const n = parseTicketSeq(task.ticketNumber)
    if (n > max) max = n
  }

  return tasks.map((task) => {
    if (parseTicketSeq(task.ticketNumber) > 0) return task
    max += 1
    return { ...task, ticketNumber: `TD-${max}` }
  })
}

function nowIso() {
  return new Date().toISOString()
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @returns {Task | undefined}
 */
function findTask(tasks, id) {
  return tasks.find((t) => t.id === id)
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @returns {Task[]}
 */
export function childrenOf(tasks, id) {
  return tasks.filter((t) => t.parentTaskId === id)
}

/**
 * @param {unknown} value
 * @returns {value is Priority}
 */
function isPriority(value) {
  return PRIORITIES.includes(/** @type {Priority} */ (value))
}

/**
 * @param {unknown} value
 * @returns {value is Status}
 */
function isStatus(value) {
  return STATUSES.includes(/** @type {Status} */ (value))
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parseEffort(value) {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

/**
 * @param {Task[]} tasks
 * @param {string} taskId
 * @param {string | null | undefined} parentId
 * @returns {boolean}
 */
export function wouldCreateCycle(tasks, taskId, parentId) {
  if (parentId == null || parentId === '') return false
  if (parentId === taskId) return true

  const byId = new Map(tasks.map((t) => [t.id, t]))
  const visited = new Set()
  let current = parentId

  while (current) {
    if (current === taskId) return true
    if (visited.has(current)) return true
    visited.add(current)
    const node = byId.get(current)
    if (!node) return true
    current = node.parentTaskId
  }

  return false
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @returns {boolean}
 */
export function canFinish(tasks, id) {
  return childrenOf(tasks, id).every((child) => child.status === 'finished')
}

/**
 * @param {Task[]} tasks
 * @returns {Record<Status, Task[]>}
 */
export function groupByStatus(tasks) {
  /** @type {Record<Status, Task[]>} */
  const groups = {
    backlog: [],
    in_process: [],
    blocked: [],
    finished: [],
  }
  for (const task of tasks) {
    if (groups[task.status]) groups[task.status].push(task)
  }
  return groups
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function normalizeLinkIds(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const item of raw) {
    const id = String(item ?? '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/**
 * Normalize a single task-like object. Used by import and storage.
 * @param {unknown} item
 * @param {{ keepId?: boolean, knownIds?: Set<string> }} [opts]
 * @returns {Task | null}
 */
function normalizeTask(item, opts = {}) {
  const { keepId = false } = opts
  const stamp = nowIso()

  if (!item || typeof item !== 'object') return null

  const title = String(item.title ?? '').trim()
  if (!title) return null

  let status = 'backlog'
  if (item.status === 'stuck') {
    // Legacy Stuck column maps onto Blocked.
    status = 'blocked'
  } else if (isStatus(item.status)) {
    status = item.status
  }

  const priority = isPriority(item.priority) ? item.priority : 'p0'
  const effortRaw = parseEffort(item.effort)
  if (effortRaw === undefined) return null

  const id =
    keepId && typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : createId()

  let parentTaskId = null
  if (item.parentTaskId != null && item.parentTaskId !== '') {
    parentTaskId = String(item.parentTaskId)
  }

  const ticketNumber =
    typeof item.ticketNumber === 'string' ? item.ticketNumber.trim() : ''

  return {
    id,
    ticketNumber,
    title,
    priority,
    status,
    parentTaskId,
    objective: String(item.objective ?? '').trim(),
    effort: effortRaw,
    linkedTaskIds: normalizeLinkIds(item.linkedTaskIds),
    createdAt:
      typeof item.createdAt === 'string' && item.createdAt
        ? item.createdAt
        : stamp,
    updatedAt:
      typeof item.updatedAt === 'string' && item.updatedAt
        ? item.updatedAt
        : stamp,
  }
}

/**
 * Repair parent/link references that point outside the set.
 * @param {Task[]} tasks
 * @returns {Task[]}
 */
function repairReferences(tasks) {
  const ids = new Set(tasks.map((t) => t.id))
  return tasks.map((task) => {
    let parentTaskId = task.parentTaskId
    if (parentTaskId && !ids.has(parentTaskId)) parentTaskId = null
    if (parentTaskId && wouldCreateCycle(tasks, task.id, parentTaskId)) {
      parentTaskId = null
    }

    const linkedTaskIds = task.linkedTaskIds.filter(
      (id) => id !== task.id && ids.has(id),
    )

    return { ...task, parentTaskId, linkedTaskIds }
  })
}

/**
 * Mirror undirected links so A↔B is consistent.
 * @param {Task[]} tasks
 * @returns {Task[]}
 */
function mirrorLinks(tasks) {
  const linkMap = new Map(tasks.map((t) => [t.id, new Set()]))

  for (const task of tasks) {
    for (const otherId of task.linkedTaskIds) {
      if (otherId === task.id) continue
      if (!linkMap.has(otherId)) continue
      linkMap.get(task.id).add(otherId)
      linkMap.get(otherId).add(task.id)
    }
  }

  return tasks.map((task) => ({
    ...task,
    linkedTaskIds: [...linkMap.get(task.id)],
  }))
}

/**
 * @param {unknown} raw
 * @param {{ keepIds?: boolean }} [opts]
 * @returns {Task[] | null}
 */
export function normalizeImported(raw, opts = {}) {
  const keepIds = opts.keepIds ?? false
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.tasks)
      ? raw.tasks
      : null

  if (!list) return null

  const mapped = list
    .map((item) => normalizeTask(item, { keepId: keepIds }))
    .filter(Boolean)

  return ensureTicketNumbers(mirrorLinks(repairReferences(mapped)))
}

/**
 * @param {Task[]} tasks
 * @param {{
 *   title: string,
 *   ticketNumber?: string,
 *   priority?: Priority,
 *   parentTaskId?: string | null,
 *   objective?: string,
 *   effort?: number | null | string,
 *   linkedTaskIds?: string[],
 * }} input
 * @returns {Result}
 */
export function createTask(tasks, input) {
  const title = String(input?.title ?? '').trim()
  if (!title) return { ok: false, reason: 'title-required' }

  const ticketNumber = String(
    input?.ticketNumber ?? nextTicketNumber(tasks),
  ).trim()
  if (!ticketNumber) return { ok: false, reason: 'ticket-required' }

  // Idempotency: repeating Done with the same ticket returns the existing task.
  const existing = tasks.find((t) => t.ticketNumber === ticketNumber)
  if (existing) {
    return { ok: true, tasks, task: existing }
  }

  const priority =
    input?.priority == null || input.priority === ''
      ? 'p0'
      : input.priority
  if (!isPriority(priority)) return { ok: false, reason: 'priority-invalid' }

  const effort = parseEffort(input?.effort)
  if (effort === undefined) return { ok: false, reason: 'effort-invalid' }

  const id = createId()
  let parentTaskId = null
  if (input?.parentTaskId != null && input.parentTaskId !== '') {
    parentTaskId = String(input.parentTaskId)
    if (!findTask(tasks, parentTaskId)) {
      return { ok: false, reason: 'parent-not-found' }
    }
    if (wouldCreateCycle(tasks, id, parentTaskId)) {
      return { ok: false, reason: 'parent-cycle' }
    }
  }

  const knownIds = new Set(tasks.map((t) => t.id))
  const linkedTaskIds = normalizeLinkIds(input?.linkedTaskIds).filter(
    (linkId) => linkId !== id && knownIds.has(linkId),
  )

  const stamp = nowIso()
  /** @type {Task} */
  const task = {
    id,
    ticketNumber,
    title,
    priority,
    status: 'backlog',
    parentTaskId,
    objective: String(input?.objective ?? '').trim(),
    effort,
    linkedTaskIds: [],
    createdAt: stamp,
    updatedAt: stamp,
  }

  let next = [task, ...tasks]
  if (linkedTaskIds.length > 0) {
    const linked = setLinks(next, id, linkedTaskIds)
    if (!linked.ok) return linked
    next = linked.tasks
  }

  return { ok: true, tasks: next, task: findTask(next, id) }
}

/**
 * Insert a task after the last task that already has the target status.
 * @param {Task[]} tasks
 * @param {Task} task
 * @param {Status} status
 * @returns {Task[]}
 */
function placeInStatus(tasks, task, status) {
  const without = tasks.filter((t) => t.id !== task.id)
  const updated = { ...task, status, updatedAt: nowIso() }
  let insertAt = without.length
  for (let i = without.length - 1; i >= 0; i -= 1) {
    if (without[i].status === status) {
      insertAt = i + 1
      break
    }
  }
  const next = [...without]
  next.splice(insertAt, 0, updated)
  return next
}

/**
 * Propagate blocked status up the parent chain.
 * @param {Task[]} tasks
 * @param {string} fromId
 * @returns {Task[]}
 */
function propagateBlockedUp(tasks, fromId) {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const visited = new Set([fromId])
  const stamp = nowIso()
  let current = byId.get(fromId)?.parentTaskId

  while (current) {
    if (visited.has(current)) break
    visited.add(current)
    const parent = byId.get(current)
    if (!parent) break
    if (parent.status !== 'blocked') {
      byId.set(current, {
        ...parent,
        status: 'blocked',
        updatedAt: stamp,
      })
    }
    current = parent.parentTaskId
  }

  return tasks.map((t) => byId.get(t.id) ?? t)
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @param {Status} status
 * @returns {Result}
 */
export function moveTask(tasks, id, status) {
  if (!isStatus(status)) return { ok: false, reason: 'status-invalid' }

  const task = findTask(tasks, id)
  if (!task) return { ok: false, reason: 'task-not-found' }

  if (task.status === status) return { ok: true, tasks, task }

  if (status === 'finished' && !canFinish(tasks, id)) {
    const open = childrenOf(tasks, id).filter((c) => c.status !== 'finished')
    return {
      ok: false,
      reason: 'children-unfinished',
      openChildTitles: open.map((c) => c.title),
    }
  }

  let next = placeInStatus(tasks, task, status)
  if (status === 'blocked') {
    next = propagateBlockedUp(next, id)
  }

  return { ok: true, tasks: next, task: findTask(next, id) }
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @param {string | null} parentTaskId
 * @returns {Result}
 */
export function setParent(tasks, id, parentTaskId) {
  const task = findTask(tasks, id)
  if (!task) return { ok: false, reason: 'task-not-found' }

  let nextParent = null
  if (parentTaskId != null && parentTaskId !== '') {
    nextParent = String(parentTaskId)
    if (!findTask(tasks, nextParent)) {
      return { ok: false, reason: 'parent-not-found' }
    }
    if (wouldCreateCycle(tasks, id, nextParent)) {
      return { ok: false, reason: 'parent-cycle' }
    }
  }

  const next = tasks.map((t) =>
    t.id === id
      ? { ...t, parentTaskId: nextParent, updatedAt: nowIso() }
      : t,
  )
  return { ok: true, tasks: next, task: findTask(next, id) }
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @param {string[]} linkIds
 * @returns {Result}
 */
export function setLinks(tasks, id, linkIds) {
  const task = findTask(tasks, id)
  if (!task) return { ok: false, reason: 'task-not-found' }

  const knownIds = new Set(tasks.map((t) => t.id))
  const desired = new Set(
    normalizeLinkIds(linkIds).filter(
      (linkId) => linkId !== id && knownIds.has(linkId),
    ),
  )
  const previous = new Set(task.linkedTaskIds)

  const next = tasks.map((t) => {
    if (t.id === id) {
      return {
        ...t,
        linkedTaskIds: [...desired],
        updatedAt: nowIso(),
      }
    }

    const links = new Set(t.linkedTaskIds)
    if (desired.has(t.id)) {
      links.add(id)
    } else if (previous.has(t.id)) {
      links.delete(id)
    } else {
      return t
    }
    return {
      ...t,
      linkedTaskIds: [...links],
      updatedAt: nowIso(),
    }
  })

  return { ok: true, tasks: next, task: findTask(next, id) }
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @param {{
 *   title?: string,
 *   priority?: Priority,
 *   objective?: string,
 *   effort?: number | null | string,
 *   parentTaskId?: string | null,
 *   linkedTaskIds?: string[],
 * }} patch
 * @returns {Result}
 */
export function updateTask(tasks, id, patch) {
  const task = findTask(tasks, id)
  if (!task) return { ok: false, reason: 'task-not-found' }

  let working = tasks
  let current = task

  if (patch.title !== undefined) {
    const title = String(patch.title).trim()
    if (!title) return { ok: false, reason: 'title-required' }
    working = working.map((t) =>
      t.id === id ? { ...t, title, updatedAt: nowIso() } : t,
    )
    current = findTask(working, id)
  }

  if (patch.priority !== undefined) {
    if (!isPriority(patch.priority)) {
      return { ok: false, reason: 'priority-invalid' }
    }
    working = working.map((t) =>
      t.id === id
        ? { ...t, priority: patch.priority, updatedAt: nowIso() }
        : t,
    )
    current = findTask(working, id)
  }

  if (patch.objective !== undefined) {
    working = working.map((t) =>
      t.id === id
        ? {
            ...t,
            objective: String(patch.objective).trim(),
            updatedAt: nowIso(),
          }
        : t,
    )
    current = findTask(working, id)
  }

  if (patch.effort !== undefined) {
    const effort = parseEffort(patch.effort)
    if (effort === undefined) return { ok: false, reason: 'effort-invalid' }
    working = working.map((t) =>
      t.id === id ? { ...t, effort, updatedAt: nowIso() } : t,
    )
    current = findTask(working, id)
  }

  if (patch.parentTaskId !== undefined) {
    const parentResult = setParent(working, id, patch.parentTaskId)
    if (!parentResult.ok) return parentResult
    working = parentResult.tasks
    current = parentResult.task
  }

  if (patch.linkedTaskIds !== undefined) {
    const linkResult = setLinks(working, id, patch.linkedTaskIds)
    if (!linkResult.ok) return linkResult
    working = linkResult.tasks
    current = linkResult.task
  }

  return { ok: true, tasks: working, task: current }
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @returns {Result}
 */
export function deleteTask(tasks, id) {
  if (!findTask(tasks, id)) return { ok: false, reason: 'task-not-found' }

  const stamp = nowIso()
  const next = tasks
    .filter((t) => t.id !== id)
    .map((t) => {
      let changed = false
      let parentTaskId = t.parentTaskId
      let linkedTaskIds = t.linkedTaskIds

      if (parentTaskId === id) {
        parentTaskId = null
        changed = true
      }
      if (linkedTaskIds.includes(id)) {
        linkedTaskIds = linkedTaskIds.filter((linkId) => linkId !== id)
        changed = true
      }
      return changed ? { ...t, parentTaskId, linkedTaskIds, updatedAt: stamp } : t
    })

  return { ok: true, tasks: next }
}
