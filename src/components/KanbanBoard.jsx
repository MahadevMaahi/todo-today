import { useEffect, useRef, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import { STATUSES, groupByStatus, sortByPriority } from '../todos/model'

export default function KanbanBoard({ tasks, onOpenTask, onMove, onAddTask }) {
  const rawGroups = groupByStatus(tasks)
  // Sort each column by priority (P0 first) before rendering.
  const groups = Object.fromEntries(
    STATUSES.map((s) => [s, sortByPriority(rawGroups[s])]),
  )

  const draggedIdRef = useRef(null)
  const [dropStatus, setDropStatus] = useState(null)
  // Pointer-drag state: active flag, ghost element, and offset from card origin.
  const ptrRef = useRef({ active: false, ghostEl: null, offsetX: 0, offsetY: 0 })
  // Keep a stable ref to onMove so window listeners never hold a stale closure.
  const onMoveRef = useRef(onMove)
  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  /**
   * Determine which Kanban column (if any) is under the pointer.
   * Temporarily hides the ghost so it doesn't block the hit-test.
   */
  function columnAtPoint(x, y) {
    const ghost = ptrRef.current.ghostEl
    if (ghost) ghost.style.visibility = 'hidden'
    const el = document.elementFromPoint(x, y)
    if (ghost) ghost.style.visibility = ''
    return el?.closest('[data-status]')?.dataset.status ?? null
  }

  /**
   * Called by TaskCard on pointerdown. Starts a pointer-drag:
   * creates the ghost, records offsets, and registers window listeners.
   */
  function handleCardPointerDown(taskId, e) {
    // Only left-click on mouse; any touch or pen is fine.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Ignore if something is already being dragged.
    if (ptrRef.current.active) return

    // Prevent text selection and default scroll-on-touch while dragging.
    e.preventDefault()

    draggedIdRef.current = taskId
    const state = ptrRef.current
    state.active = true

    const srcEl = e.currentTarget
    const rect = srcEl.getBoundingClientRect()

    // Clone the card as a fixed-position ghost.
    const ghost = srcEl.cloneNode(true)
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      margin: '0',
      pointerEvents: 'none',
      zIndex: '1000',
      transition: 'none',
    })
    ghost.classList.add('task-card-ghost')
    document.body.appendChild(ghost)

    state.ghostEl = ghost
    state.offsetX = e.clientX - rect.left
    state.offsetY = e.clientY - rect.top

    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)
  }

  function onWindowPointerMove(e) {
    const state = ptrRef.current
    if (!state.active) return

    if (state.ghostEl) {
      state.ghostEl.style.left = `${e.clientX - state.offsetX}px`
      state.ghostEl.style.top = `${e.clientY - state.offsetY}px`
    }

    setDropStatus(columnAtPoint(e.clientX, e.clientY))
  }

  function onWindowPointerUp(e) {
    const state = ptrRef.current
    if (!state.active) return

    const taskId = draggedIdRef.current
    const targetStatus = columnAtPoint(e.clientX, e.clientY)

    // Cleanup ghost and state before calling onMove (avoids flash).
    state.ghostEl?.remove()
    state.active = false
    state.ghostEl = null
    draggedIdRef.current = null
    setDropStatus(null)

    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)
    window.removeEventListener('pointercancel', onWindowPointerUp)

    if (targetStatus && taskId) {
      onMoveRef.current(taskId, targetStatus)
    }
  }

  // Clean up any orphaned window listeners if the component unmounts mid-drag.
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerUp)
      window.removeEventListener('pointercancel', onWindowPointerUp)
      ptrRef.current.ghostEl?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="kanban-board" role="region" aria-label="Kanban board">
      {STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={groups[status]}
          allTasks={tasks}
          isDropTarget={dropStatus === status}
          onOpenTask={onOpenTask}
          onMove={onMove}
          onAddTask={onAddTask}
          onCardPointerDown={handleCardPointerDown}
        />
      ))}
    </div>
  )
}
