import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  childrenOf,
} from '../todos/model'

export default function TaskCard({
  task,
  tasks,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}) {
  const parent = task.parentTaskId
    ? tasks.find((t) => t.id === task.parentTaskId)
    : null
  const childCount = childrenOf(tasks, task.id).length
  const linkCount = task.linkedTaskIds?.length ?? 0
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority
  const statusLabel = STATUS_LABELS[task.status] ?? task.status

  const meta = []
  if (parent) meta.push(`Parent: ${parent.ticketNumber}`)
  if (childCount > 0) {
    meta.push(`${childCount} subtask${childCount === 1 ? '' : 's'}`)
  }
  if (task.effort != null) meta.push(`${task.effort}h`)
  if (linkCount > 0) {
    meta.push(`${linkCount} link${linkCount === 1 ? '' : 's'}`)
  }

  return (
    <article
      className="task-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(task.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      aria-label={`${task.ticketNumber} ${task.title}, ${priorityLabel}, ${statusLabel}`}
    >
      <button
        type="button"
        className="task-card-main"
        onClick={() => onOpen(task.id)}
      >
        <span className="task-card-heading">
          <span className="ticket-badge">{task.ticketNumber}</span>
          <span className="task-card-title">{task.title}</span>
        </span>
        <span className="task-card-row">
          <span className={`priority-badge priority-${task.priority}`}>
            {priorityLabel}
          </span>
          {meta.length > 0 ? (
            <span className="task-card-meta">{meta.join(' · ')}</span>
          ) : null}
        </span>
      </button>

      <label className="task-card-move">
        <select
          value={task.status}
          aria-label={`Move ${task.title} to`}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            onMove(task.id, e.target.value)
          }}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}
