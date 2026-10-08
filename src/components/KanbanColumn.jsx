import TaskCard from './TaskCard'
import { STATUS_LABELS } from '../todos/model'

export default function KanbanColumn({
  status,
  tasks,
  allTasks,
  isDropTarget,
  onOpenTask,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropColumn,
}) {
  const label = STATUS_LABELS[status]

  return (
    <section
      className={`kanban-column status-${status}${isDropTarget ? ' is-drop-target' : ''}`}
      aria-label={`${label} column`}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOverColumn?.(status)
      }}
      onDragLeave={() => onDragLeaveColumn?.(status)}
      onDrop={(e) => {
        e.preventDefault()
        const id =
          e.dataTransfer.getData('text/plain') ||
          e.dataTransfer.getData('application/x-task-id')
        onDropColumn?.(status, id)
      }}
    >
      <header className="kanban-column-header">
        <h2 className="kanban-column-title">{label}</h2>
        <span className="kanban-column-count">{tasks.length}</span>
      </header>

      <div className="kanban-column-body">
        {tasks.length === 0 ? (
          <p className="kanban-empty">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              tasks={allTasks}
              onOpen={onOpenTask}
              onMove={onMove}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  )
}
