import { describe, expect, it } from 'vitest'
import {
  canFinish,
  childrenOf,
  createTask,
  deleteTask,
  formatTaskOption,
  groupByStatus,
  moveTask,
  nextTicketNumber,
  normalizeImported,
  setLinks,
  setParent,
  updateTask,
  wouldCreateCycle,
} from './model.js'
import { STORAGE_KEY, loadTasks, saveTasks } from './storage.js'

function task(partial) {
  const stamp = '2024-01-01T00:00:00.000Z'
  return {
    id: partial.id,
    ticketNumber: partial.ticketNumber ?? `TD-${partial.id}`,
    title: partial.title ?? partial.id,
    priority: partial.priority ?? 'p0',
    status: partial.status ?? 'backlog',
    parentTaskId: partial.parentTaskId ?? null,
    objective: partial.objective ?? '',
    effort: partial.effort ?? null,
    linkedTaskIds: partial.linkedTaskIds ?? [],
    createdAt: stamp,
    updatedAt: stamp,
  }
}

describe('createTask', () => {
  it('rejects a blank title', () => {
    expect(createTask([], { title: '   ' })).toEqual({
      ok: false,
      reason: 'title-required',
    })
  })

  it('defaults priority to p0 and starts in backlog with TD-1', () => {
    const result = createTask([], { title: 'Ship it' })
    expect(result.ok).toBe(true)
    expect(result.task).toMatchObject({
      title: 'Ship it',
      ticketNumber: 'TD-1',
      priority: 'p0',
      status: 'backlog',
      parentTaskId: null,
      objective: '',
      effort: null,
      linkedTaskIds: [],
    })
    expect(result.task.id).toBeTruthy()
    expect(result.tasks[0].id).toBe(result.task.id)
  })

  it('treats ticketNumber as an idempotency token', () => {
    const first = createTask([], { title: 'Once', ticketNumber: 'TD-7' })
    expect(first.ok).toBe(true)
    const second = createTask(first.tasks, {
      title: 'Again',
      ticketNumber: 'TD-7',
    })
    expect(second.ok).toBe(true)
    expect(second.tasks).toHaveLength(1)
    expect(second.task.id).toBe(first.task.id)
    expect(second.task.title).toBe('Once')
  })

  it('formats ticket options for pickers', () => {
    expect(formatTaskOption({ ticketNumber: 'TD-3', title: 'Ship' })).toBe(
      'TD-3 — Ship',
    )
    expect(nextTicketNumber([task({ id: 'a', ticketNumber: 'TD-4' })])).toBe(
      'TD-5',
    )
  })

  it('stores optional fields and links', () => {
    const parent = task({ id: 'p', title: 'Parent' })
    const sibling = task({ id: 's', title: 'Sibling' })
    const result = createTask([parent, sibling], {
      title: 'Child',
      priority: 'p1',
      parentTaskId: 'p',
      objective: 'Notes here',
      effort: 2.5,
      linkedTaskIds: ['s', 's', 'missing'],
    })
    expect(result.ok).toBe(true)
    expect(result.task).toMatchObject({
      title: 'Child',
      priority: 'p1',
      status: 'backlog',
      parentTaskId: 'p',
      objective: 'Notes here',
      effort: 2.5,
      linkedTaskIds: ['s'],
    })
    expect(findLinks(result.tasks, 's')).toContain(result.task.id)
  })

  it('rejects negative effort', () => {
    expect(createTask([], { title: 'Bad', effort: -1 })).toEqual({
      ok: false,
      reason: 'effort-invalid',
    })
  })

  it('treats empty effort as null', () => {
    const result = createTask([], { title: 'Ok', effort: '' })
    expect(result.ok).toBe(true)
    expect(result.task.effort).toBeNull()
  })
})

function findLinks(tasks, id) {
  return tasks.find((t) => t.id === id)?.linkedTaskIds ?? []
}

describe('parent relationships', () => {
  it('stores a valid parent and derives children', () => {
    const parent = task({ id: 'a', title: 'A' })
    const created = createTask([parent], {
      title: 'B',
      parentTaskId: 'a',
    })
    expect(created.ok).toBe(true)
    expect(childrenOf(created.tasks, 'a').map((t) => t.id)).toEqual([
      created.task.id,
    ])
  })

  it('rejects self-parenting', () => {
    const a = task({ id: 'a' })
    expect(setParent([a], 'a', 'a')).toEqual({
      ok: false,
      reason: 'parent-cycle',
    })
    expect(wouldCreateCycle([a], 'a', 'a')).toBe(true)
  })

  it('rejects indirect cycles when an ancestor would parent a descendant', () => {
    const tasks = [
      task({ id: 'a' }),
      task({ id: 'b', parentTaskId: 'a' }),
      task({ id: 'c', parentTaskId: 'b' }),
    ]
    // A ← C would create A → B → C → A
    expect(wouldCreateCycle(tasks, 'a', 'c')).toBe(true)
    expect(setParent(tasks, 'a', 'c').ok).toBe(false)
    // Moving C under A flattens the tree and is allowed
    expect(wouldCreateCycle(tasks, 'c', 'a')).toBe(false)
    expect(setParent(tasks, 'c', 'a').ok).toBe(true)
  })

  it('allows an unrelated parent', () => {
    const tasks = [task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' })]
    const result = setParent(tasks, 'c', 'a')
    expect(result.ok).toBe(true)
    expect(result.task.parentTaskId).toBe('a')
  })
})

describe('completion rules', () => {
  it('blocks finishing a parent while children are unfinished', () => {
    const tasks = [
      task({ id: 'p', status: 'in_process' }),
      task({ id: 'c1', parentTaskId: 'p', status: 'finished' }),
      task({ id: 'c2', parentTaskId: 'p', status: 'in_process' }),
    ]
    expect(canFinish(tasks, 'p')).toBe(false)
    const result = moveTask(tasks, 'p', 'finished')
    expect(result).toMatchObject({
      ok: false,
      reason: 'children-unfinished',
      openChildTitles: ['c2'],
    })
    expect(result.tasks).toBeUndefined()
    expect(findTaskStatus(tasks, 'p')).toBe('in_process')
  })

  it('allows finishing when every direct child is finished', () => {
    const tasks = [
      task({ id: 'p', status: 'in_process' }),
      task({ id: 'c1', parentTaskId: 'p', status: 'finished' }),
      task({ id: 'c2', parentTaskId: 'p', status: 'finished' }),
    ]
    const result = moveTask(tasks, 'p', 'finished')
    expect(result.ok).toBe(true)
    expect(result.task.status).toBe('finished')
  })

  it('blocks nested unfinished grandchildren via the middle parent', () => {
    const tasks = [
      task({ id: 'a', status: 'in_process' }),
      task({ id: 'b', parentTaskId: 'a', status: 'in_process' }),
      task({ id: 'c', parentTaskId: 'b', status: 'in_process' }),
    ]
    expect(moveTask(tasks, 'b', 'finished').ok).toBe(false)
    expect(moveTask(tasks, 'a', 'finished').ok).toBe(false)
    const finishC = moveTask(tasks, 'c', 'finished')
    const finishB = moveTask(finishC.tasks, 'b', 'finished')
    const finishA = moveTask(finishB.tasks, 'a', 'finished')
    expect(finishA.ok).toBe(true)
  })
})

function findTaskStatus(tasks, id) {
  return tasks.find((t) => t.id === id)?.status
}

describe('blocked propagation', () => {
  it('blocks the parent when a child becomes blocked', () => {
    const tasks = [
      task({ id: 'p', status: 'in_process' }),
      task({ id: 'c', parentTaskId: 'p', status: 'in_process' }),
    ]
    const result = moveTask(tasks, 'c', 'blocked')
    expect(result.ok).toBe(true)
    expect(findTaskStatus(result.tasks, 'c')).toBe('blocked')
    expect(findTaskStatus(result.tasks, 'p')).toBe('blocked')
  })

  it('propagates through a nested hierarchy', () => {
    const tasks = [
      task({ id: 'a', status: 'finished' }),
      task({ id: 'b', parentTaskId: 'a', status: 'in_process' }),
      task({ id: 'c', parentTaskId: 'b', status: 'in_process' }),
    ]
    const result = moveTask(tasks, 'c', 'blocked')
    expect(findTaskStatus(result.tasks, 'c')).toBe('blocked')
    expect(findTaskStatus(result.tasks, 'b')).toBe('blocked')
    expect(findTaskStatus(result.tasks, 'a')).toBe('blocked')
  })

  it('does not change siblings and does not restore parent when child leaves blocked', () => {
    const tasks = [
      task({ id: 'p', status: 'blocked' }),
      task({ id: 'c1', parentTaskId: 'p', status: 'blocked' }),
      task({ id: 'c2', parentTaskId: 'p', status: 'in_process' }),
    ]
    const result = moveTask(tasks, 'c1', 'in_process')
    expect(findTaskStatus(result.tasks, 'c1')).toBe('in_process')
    expect(findTaskStatus(result.tasks, 'p')).toBe('blocked')
    expect(findTaskStatus(result.tasks, 'c2')).toBe('in_process')
  })
})

describe('kanban moves', () => {
  it('moves between columns', () => {
    const tasks = [task({ id: 'a', status: 'backlog' })]
    let next = moveTask(tasks, 'a', 'in_process')
    expect(next.task.status).toBe('in_process')
    next = moveTask(next.tasks, 'a', 'blocked')
    expect(next.task.status).toBe('blocked')
    next = moveTask(next.tasks, 'a', 'finished')
    expect(next.task.status).toBe('finished')
  })

})

describe('linked tasks', () => {
  it('mirrors links and prevents duplicates and self-links', () => {
    const tasks = [task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' })]
    let result = setLinks(tasks, 'a', ['b', 'c', 'b', 'a', 'missing'])
    expect(result.ok).toBe(true)
    expect(result.task.linkedTaskIds).toEqual(['b', 'c'])
    expect(findLinks(result.tasks, 'b')).toEqual(['a'])
    expect(findLinks(result.tasks, 'c')).toEqual(['a'])

    result = setLinks(result.tasks, 'a', ['b'])
    expect(result.task.linkedTaskIds).toEqual(['b'])
    expect(findLinks(result.tasks, 'c')).toEqual([])
    expect(findLinks(result.tasks, 'b')).toEqual(['a'])
  })

  it('removes links when a task is deleted', () => {
    const tasks = [
      task({ id: 'a', linkedTaskIds: ['b'] }),
      task({ id: 'b', linkedTaskIds: ['a'] }),
      task({ id: 'c', parentTaskId: 'a' }),
    ]
    const result = deleteTask(tasks, 'a')
    expect(result.ok).toBe(true)
    expect(result.tasks.map((t) => t.id)).toEqual(['b', 'c'])
    expect(findLinks(result.tasks, 'b')).toEqual([])
    expect(result.tasks.find((t) => t.id === 'c').parentTaskId).toBeNull()
  })
})

describe('normalizeImported', () => {
  it('round-trips parent and links when keeping ids', () => {
    const items = normalizeImported(
      [
        {
          id: 'a',
          title: 'A',
          priority: 'p1',
          status: 'in_process',
          linkedTaskIds: ['b'],
        },
        {
          id: 'b',
          title: 'B',
          parentTaskId: 'a',
          linkedTaskIds: ['a'],
          effort: 3,
          objective: 'Do the thing',
        },
      ],
      { keepIds: true },
    )
    expect(items.find((t) => t.id === 'b').parentTaskId).toBe('a')
    expect(items.find((t) => t.id === 'a').linkedTaskIds).toContain('b')
    expect(items.find((t) => t.id === 'b').effort).toBe(3)
    expect(items.find((t) => t.id === 'b').objective).toBe('Do the thing')
    expect(items.every((t) => t.ticketNumber)).toBe(true)
  })

  it('clears dangling parent ids', () => {
    const items = normalizeImported(
      [{ id: 'a', title: 'A', parentTaskId: 'missing' }],
      { keepIds: true },
    )
    expect(items[0].parentTaskId).toBeNull()
  })

  it('drops blank titles and returns null for non-array shapes', () => {
    expect(normalizeImported([{ title: '' }])).toEqual([])
    expect(normalizeImported({ nope: true })).toBeNull()
    expect(normalizeImported(null)).toBeNull()
    expect(normalizeImported('string')).toBeNull()
  })

  it('accepts a { tasks } wrapper', () => {
    const items = normalizeImported({ tasks: [{ title: 'wrapped' }] })
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('wrapped')
  })
})

describe('groupByStatus', () => {
  it('buckets tasks by status', () => {
    const tasks = [
      task({ id: 'a', status: 'backlog' }),
      task({ id: 'b', status: 'finished' }),
      task({ id: 'c', status: 'backlog' }),
    ]
    const groups = groupByStatus(tasks)
    expect(groups.backlog.map((t) => t.id)).toEqual(['a', 'c'])
    expect(groups.finished.map((t) => t.id)).toEqual(['b'])
    expect(groups.blocked).toEqual([])
  })
})

describe('updateTask', () => {
  it('rejects empty title without deleting the task', () => {
    const tasks = [task({ id: 'a', title: 'Keep' })]
    const result = updateTask(tasks, 'a', { title: '  ' })
    expect(result.ok).toBe(false)
    expect(tasks).toHaveLength(1)
  })
})

describe('storage', () => {
  function memoryStorage(initial = {}) {
    const data = { ...initial }
    return {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(data, key)
          ? data[key]
          : null
      },
      setItem(key, value) {
        data[key] = String(value)
      },
      removeItem(key) {
        delete data[key]
      },
      _data: data,
    }
  }

  it('saves and loads tasks', () => {
    const storage = memoryStorage()
    const tasks = [task({ id: 'a', title: 'Persisted', effort: 1 })]
    expect(saveTasks(tasks, storage)).toEqual({ ok: true })
    expect(JSON.parse(storage._data[STORAGE_KEY])).toHaveLength(1)
    expect(loadTasks(storage)).toMatchObject([
      { id: 'a', title: 'Persisted', effort: 1 },
    ])
  })

  it('returns an empty list for invalid JSON', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{not-json' })
    expect(loadTasks(storage)).toEqual([])
  })

  it('returns ok:false when setItem throws', () => {
    const storage = {
      getItem() {
        return null
      },
      setItem() {
        throw new Error('quota')
      },
    }
    expect(saveTasks([task({ id: 'a' })], storage)).toEqual({ ok: false })
  })
})
