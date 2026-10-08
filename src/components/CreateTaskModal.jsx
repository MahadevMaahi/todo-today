import { useId, useState } from 'react'
import Dialog from './Dialog'
import LinkTaskPicker from './LinkTaskPicker'
import {
  PRIORITIES,
  PRIORITY_LABELS,
  formatTaskOption,
  wouldCreateCycle,
} from '../todos/model'

const emptyFields = {
  title: '',
  priority: 'p0',
  parentTaskId: '',
  objective: '',
  effort: '',
  linkedTaskIds: [],
}

function CreateTaskForm({ tasks, ticketNumber, onClose, onCreate }) {
  const [form, setForm] = useState(emptyFields)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const titleId = useId()
  const ticketId = useId()
  const priorityId = useId()
  const parentId = useId()
  const objectiveId = useId()
  const effortId = useId()

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    /** @type {Record<string, string>} */
    const next = {}
    if (!form.title.trim()) next.title = 'Enter a task title.'
    if (!form.priority) next.priority = 'Choose a priority.'

    if (form.parentTaskId) {
      const parent = tasks.find((t) => t.id === form.parentTaskId)
      if (!parent) next.parentTaskId = 'Parent task not found.'
      else if (wouldCreateCycle(tasks, '__new__', form.parentTaskId)) {
        next.parentTaskId = 'That parent would create a loop.'
      }
    }

    if (form.effort !== '') {
      const n = Number(form.effort)
      if (!Number.isFinite(n) || n < 0) {
        next.effort = 'Effort must be zero or a positive number of hours.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return

    setSubmitting(true)
    const result = onCreate({
      title: form.title,
      ticketNumber,
      priority: form.priority,
      parentTaskId: form.parentTaskId || null,
      objective: form.objective,
      effort: form.effort === '' ? null : Number(form.effort),
      linkedTaskIds: form.linkedTaskIds,
    })

    if (!result?.ok) {
      setSubmitting(false)
      const map = {
        'title-required': { title: 'Enter a task title.' },
        'priority-invalid': { priority: 'Choose a priority.' },
        'parent-not-found': { parentTaskId: 'Parent task not found.' },
        'parent-cycle': { parentTaskId: 'That parent would create a loop.' },
        'effort-invalid': {
          effort: 'Effort must be zero or a positive number of hours.',
        },
      }
      setErrors(map[result?.reason] ?? { title: 'Couldn’t create that task.' })
      return
    }

    onClose()
  }

  return (
    <Dialog
      open
      title="Create task"
      onClose={onClose}
      initialFocus="field"
      className="dialog-wide"
      actions={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            data-focus="cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            className="btn btn-primary"
            data-focus="confirm"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Done'}
          </button>
        </>
      }
    >
      <form id="create-task-form" className="task-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor={ticketId}>Ticket</label>
          <input
            id={ticketId}
            type="text"
            value={ticketNumber}
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
            autoComplete="off"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? `${titleId}-error` : undefined}
          />
          {errors.title ? (
            <p id={`${titleId}-error`} className="form-error">
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor={priorityId}>Priority</label>
          <select
            id={priorityId}
            value={form.priority}
            onChange={(e) => updateField('priority', e.target.value)}
            aria-invalid={Boolean(errors.priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          {errors.priority ? (
            <p className="form-error">{errors.priority}</p>
          ) : null}
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
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTaskOption(t)}
              </option>
            ))}
          </select>
          {errors.parentTaskId ? (
            <p className="form-error">{errors.parentTaskId}</p>
          ) : null}
        </div>

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
          selectedIds={form.linkedTaskIds}
          onChange={(linkedTaskIds) => updateField('linkedTaskIds', linkedTaskIds)}
        />
      </form>
    </Dialog>
  )
}

export default function CreateTaskModal({
  open,
  tasks,
  ticketNumber,
  onClose,
  onCreate,
}) {
  if (!open || !ticketNumber) return null

  return (
    <CreateTaskForm
      key={ticketNumber}
      tasks={tasks}
      ticketNumber={ticketNumber}
      onClose={onClose}
      onCreate={onCreate}
    />
  )
}
