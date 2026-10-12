import { useRef, useState } from 'react'
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

  function handleDragStart(id) {
    draggedIdRef.current = id
  }

  function handleDragEnd() {
    draggedIdRef.current = null
    setDropStatus(null)
  }

  function handleDrop(status, idFromTransfer) {
    const id = idFromTransfer || draggedIdRef.current
    setDropStatus(null)
    draggedIdRef.current = null
    if (!id) return
    onMove(id, status)
  }

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
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOverColumn={setDropStatus}
          onDragLeaveColumn={(left) => {
            setDropStatus((current) => (current === left ? null : current))
          }}
          onDropColumn={handleDrop}
        />
      ))}
    </div>
  )
}
