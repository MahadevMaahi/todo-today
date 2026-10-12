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
  onCardPointerDown,
}) {
  const parent = task.parentTaskId
    ? tasks.find((t) => t.id === task.parentTaskId)
    : null
  const childCount = childrenOf(tasks, task.id).length
  const linkCount = task.linkedTaskIds?.length ?? 0
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority
  const statusLabel = STATUS_LABELS[task.status] ?? task.status

  const statusIdx = STATUSES.indexOf(task.status)
  const prevStatus = statusIdx > 0 ? STATUSES[statusIdx - 1] : null
  const nextStatus = statusIdx < STATUSES.length - 1 ? STATUSES[statusIdx + 1] : null

  const meta = []
  if (parent) meta.push(`Parent: ${parent.ticketNumber}`)
  if (childCount > 0) {
    meta.push(`${childCount} subtask${childCount === 1 ? '' : 's'}`)
  }
  if (task.effort != null) meta.push(`${task.effort}h`)
  if (linkCount > 0) {
    meta.push(`${linkCount} link${linkCount === 1 ? '' : 's'}`)
  }

  function handleKeyDown(e) {
    // Alt+Arrow: move card to adjacent column.
    if (e.altKey) {
      if (e.key === 'ArrowRight' && nextStatus) {
        e.preventDefault()
        onMove(task.id, nextStatus)
        return
      }
      if (e.key === 'ArrowLeft' && prevStatus) {
        e.preventDefault()
        onMove(task.id, prevStatus)
        return
      }
    }
    // Enter or Space: open detail dialog.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(task.id)
    }
  }

  return (
    <article
      className="task-card"
      data-priority={task.priority}
      tabIndex={0}
      onPointerDown={(e) => onCardPointerDown?.(task.id, e)}
      onKeyDown={handleKeyDown}
      aria-label={`${task.ticketNumber} ${task.title}, ${priorityLabel}, ${statusLabel}`}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
    >
      <button
        type="button"
        className="task-card-main"
        tabIndex={-1}
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

      {/* Hover arrow buttons replace the old inline select. */}
      <div className="task-card-actions">
        {prevStatus ? (
          <button
            type="button"
            className="task-card-move-btn"
            tabIndex={-1}
            aria-label={`Move to ${STATUS_LABELS[prevStatus]}`}
            title={`Move to ${STATUS_LABELS[prevStatus]}`}
            onClick={(e) => {
              e.stopPropagation()
              onMove(task.id, prevStatus)
            }}
          >
            &#8592;
          </button>
        ) : null}
        {nextStatus ? (
          <button
            type="button"
            className="task-card-move-btn"
            tabIndex={-1}
            aria-label={`Move to ${STATUS_LABELS[nextStatus]}`}
            title={`Move to ${STATUS_LABELS[nextStatus]}`}
            onClick={(e) => {
              e.stopPropagation()
              onMove(task.id, nextStatus)
            }}
          >
            &#8594;
          </button>
        ) : null}
      </div>
    </article>
  )
}
