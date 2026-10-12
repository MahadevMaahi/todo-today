import TaskCard from './TaskCard'
import { STATUS_LABELS } from '../todos/model'

const WIP_LIMIT = 5

export default function KanbanColumn({
  status,
  tasks,
  allTasks,
  isDropTarget,
  onOpenTask,
  onMove,
  onAddTask,
  onCardPointerDown,
}) {
  const label = STATUS_LABELS[status]
  const totalEffort = tasks.reduce((s, t) => s + (t.effort ?? 0), 0)
  const showWipWarning = status === 'in_process' && tasks.length > WIP_LIMIT

  return (
    <section
      className={`kanban-column status-${status}${isDropTarget ? ' is-drop-target' : ''}`}
      data-status={status}
      aria-label={`${label} column`}
    >
      <header className="kanban-column-header">
        <h2 className="kanban-column-title">{label}</h2>
        <div className="kanban-column-header-end">
          {totalEffort > 0 ? (
            <span className="kanban-effort-chip">{totalEffort}h</span>
          ) : null}
          <span className="kanban-column-count">{tasks.length}</span>
          {showWipWarning ? (
            <span className="kanban-wip-warning" title={`WIP limit is ${WIP_LIMIT}`}>
              ⚠ WIP &gt; {WIP_LIMIT}
            </span>
          ) : null}
        </div>
      </header>

      <div className="kanban-column-body">
        {tasks.length === 0 ? (
          status === 'backlog' ? (
            <div className="kanban-empty">
              <p>No tasks yet.</p>
              <button
                type="button"
                className="btn btn-ghost kanban-empty-cta"
                onClick={onAddTask}
              >
                + Add first task
              </button>
            </div>
          ) : (
            <div className="kanban-empty">
              <p>No tasks</p>
            </div>
          )
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              tasks={allTasks}
              onOpen={onOpenTask}
              onMove={onMove}
              onCardPointerDown={onCardPointerDown}
            />
          ))
        )}
      </div>
    </section>
  )
}
