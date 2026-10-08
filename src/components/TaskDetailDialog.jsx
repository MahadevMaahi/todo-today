import { useId, useState } from 'react'
import Dialog from './Dialog'
import LinkTaskPicker from './LinkTaskPicker'
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  childrenOf,
  formatTaskOption,
  wouldCreateCycle,
} from '../todos/model'

function TaskDetailForm({
  task,
  tasks,
  onClose,
  onUpdate,
  onMove,
  onRequestDelete,
}) {
  const titleId = useId()
  const ticketId = useId()
  const priorityId = useId()
  const statusId = useId()
  const parentId = useId()
  const objectiveId = useId()
  const effortId = useId()

  const [form, setForm] = useState(() => ({
    title: task.title,
    priority: task.priority,
    status: task.status,
    parentTaskId: task.parentTaskId ?? '',
    objective: task.objective ?? '',
    effort: task.effort == null ? '' : String(task.effort),
    linkedTaskIds: [...(task.linkedTaskIds ?? [])],
  }))
  const [errors, setErrors] = useState({})

  const children = childrenOf(tasks, task.id)
  const parentOptions = tasks.filter((t) => {
    if (t.id === task.id) return false
    return !wouldCreateCycle(tasks, task.id, t.id)
  })

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave(e) {
    e.preventDefault()
    /** @type {Record<string, string>} */
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Enter a task title.'
    if (form.effort !== '') {
      const n = Number(form.effort)
      if (!Number.isFinite(n) || n < 0) {
        nextErrors.effort = 'Effort must be zero or a positive number of hours.'
      }
    }
    if (form.parentTaskId && wouldCreateCycle(tasks, task.id, form.parentTaskId)) {
      nextErrors.parentTaskId = 'That parent would create a loop.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (form.status !== task.status) {
      const moveResult = onMove(task.id, form.status)
      if (!moveResult?.ok) {
        if (moveResult?.reason === 'children-unfinished') {
          const names = moveResult.openChildTitles?.join(', ') || 'open subtasks'
          setErrors({
            status: `Finish the open subtasks first: ${names}`,
          })
        } else {
          setErrors({ status: 'Couldn’t move this task.' })
        }
        return
      }
    }

    const result = onUpdate(task.id, {
      title: form.title,
      priority: form.priority,
      parentTaskId: form.parentTaskId || null,
      objective: form.objective,
      effort: form.effort === '' ? null : Number(form.effort),
      linkedTaskIds: form.linkedTaskIds,
    })

    if (!result?.ok) {
      const map = {
        'title-required': { title: 'Enter a task title.' },
        'priority-invalid': { priority: 'Choose a priority.' },
        'parent-not-found': { parentTaskId: 'Parent task not found.' },
        'parent-cycle': { parentTaskId: 'That parent would create a loop.' },
        'effort-invalid': {
          effort: 'Effort must be zero or a positive number of hours.',
        },
      }
      setErrors(map[result?.reason] ?? { title: 'Couldn’t save changes.' })
      return
    }

    onClose()
  }

  return (
    <Dialog
      open
      title="Task details"
      onClose={onClose}
      initialFocus="field"
      className="dialog-wide"
      actions={
        <>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onRequestDelete(task.id)}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            data-focus="cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-detail-form"
            className="btn btn-primary"
            data-focus="confirm"
          >
            Save
          </button>
        </>
      }
    >
      <form id="task-detail-form" className="task-form" onSubmit={handleSave}>
        <div className="form-field">
          <label htmlFor={ticketId}>Ticket</label>
          <input
            id={ticketId}
            type="text"
            value={task.ticketNumber}
            readOnly
            className="ticket-readonly"
          />
        </div>

        <div className="form-field">
          <label htmlFor={titleId}>Task to be completed</label>
          <input
            id={titleId}
            type="text"
            data-focus="field"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title ? <p className="form-error">{errors.title}</p> : null}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor={priorityId}>Priority</label>
            <select
              id={priorityId}
              value={form.priority}
              onChange={(e) => updateField('priority', e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={statusId}>Move to</label>
            <select
              id={statusId}
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              aria-invalid={Boolean(errors.status)}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {errors.status ? (
              <p className="form-error">{errors.status}</p>
            ) : null}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor={parentId}>Parent task</label>
          <select
            id={parentId}
            value={form.parentTaskId}
            onChange={(e) => updateField('parentTaskId', e.target.value)}
            aria-invalid={Boolean(errors.parentTaskId)}
          >
            <option value="">No parent</option>
            {parentOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTaskOption(t)}
              </option>
            ))}
          </select>
          {errors.parentTaskId ? (
            <p className="form-error">{errors.parentTaskId}</p>
          ) : null}
        </div>

        {children.length > 0 ? (
          <div className="form-field">
            <p className="form-label-text">Subtasks</p>
            <ul className="subtask-list">
              {children.map((child) => (
                <li key={child.id}>
                  <span>
                    <span className="ticket-badge">{child.ticketNumber}</span>{' '}
                    {child.title}
                  </span>
                  <span className="subtask-status">
                    {STATUS_LABELS[child.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor={objectiveId}>Objective / Notes</label>
          <textarea
            id={objectiveId}
            rows={3}
            value={form.objective}
            onChange={(e) => updateField('objective', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={effortId}>Effort (hours)</label>
          <input
            id={effortId}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={form.effort}
            onChange={(e) => updateField('effort', e.target.value)}
            aria-invalid={Boolean(errors.effort)}
          />
          {errors.effort ? <p className="form-error">{errors.effort}</p> : null}
        </div>

        <LinkTaskPicker
          tasks={tasks}
          excludeId={task.id}
          selectedIds={form.linkedTaskIds}
          onChange={(linkedTaskIds) => updateField('linkedTaskIds', linkedTaskIds)}
        />
      </form>
    </Dialog>
  )
}

export default function TaskDetailDialog({
  open,
  task,
  tasks,
  onClose,
  onUpdate,
  onMove,
  onRequestDelete,
}) {
  if (!open || !task) return null

  return (
    <TaskDetailForm
      key={task.id}
      task={task}
      tasks={tasks}
      onClose={onClose}
      onUpdate={onUpdate}
      onMove={onMove}
      onRequestDelete={onRequestDelete}
    />
  )
}
