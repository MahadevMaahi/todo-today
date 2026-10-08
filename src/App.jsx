import { useEffect, useRef, useState } from 'react'
import './App.css'
import AppNav from './components/AppNav'
import CreateTaskModal from './components/CreateTaskModal'
import DaySprintGuide from './components/DaySprintGuide'
import Dialog from './components/Dialog'
import KanbanBoard from './components/KanbanBoard'
import SiteFooter from './components/SiteFooter'
import TaskDetailDialog from './components/TaskDetailDialog'
import Toast from './components/Toast'
import { nextTicketNumber } from './todos/model'
import { useTodos } from './todos/useTodos'
import { applyTheme } from './theme'

const GUIDE_VISIBLE_KEY = 'todo-today.guideVisible'

function readGuideVisible() {
  try {
    const stored = sessionStorage.getItem(GUIDE_VISIBLE_KEY)
    if (stored === null) return true
    return stored === '1'
  } catch {
    return true
  }
}

function writeGuideVisible(visible) {
  try {
    sessionStorage.setItem(GUIDE_VISIBLE_KEY, visible ? '1' : '0')
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function moveFailureMessage(result) {
  if (!result || result.ok) return null
  if (result.reason === 'children-unfinished') {
    const names = result.openChildTitles?.join(', ') || 'open subtasks'
    return `Finish the open subtasks first: ${names}`
  }
  if (result.reason === 'task-not-found') return 'That task is no longer available.'
  if (result.reason === 'status-invalid') return 'That status is not valid.'
  return 'Couldn’t move that task.'
}

export default function App() {
  const [themeMode, setThemeMode] = useState('system')
  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [createTicket, setCreateTicket] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [guideVisible, setGuideVisible] = useState(readGuideVisible)
  const toastTimer = useRef(null)

  function setGuideOpen(visible) {
    setGuideVisible(visible)
    writeGuideVisible(visible)
  }

  const {
    todos,
    storageError,
    clearStorageError,
    createTask,
    moveTask,
    updateTask,
    deleteTask,
  } = useTodos()

  useEffect(() => {
    applyTheme(themeMode)
  }, [themeMode])

  useEffect(() => {
    if (themeMode !== 'system' || typeof window === 'undefined') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [themeMode])

  useEffect(() => {
    if (!storageError) return
    showToast(storageError, 'error')
    clearStorageError()
  }, [storageError, clearStorageError])

  const selectedTask = selectedId
    ? todos.find((t) => t.id === selectedId) ?? null
    : null

  function showToast(message, variant = 'info') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, variant })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  function closeDialog() {
    setDialog(null)
  }

  function confirmDialog() {
    if (!dialog) return
    if (dialog.type === 'delete') {
      deleteTask(dialog.taskId)
      setSelectedId(null)
      showToast('Deleted task.')
    }
    setDialog(null)
  }

  function handleMove(id, status) {
    const result = moveTask(id, status)
    const message = moveFailureMessage(result)
    if (message) showToast(message, 'error')
    return result
  }

  function handleCreate(input) {
    const result = createTask(input)
    if (result.ok) showToast(`Created ${result.task?.ticketNumber ?? 'task'}.`)
    return result
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <div className="app-column">
          <div className="app-column-body">
            <AppNav
              themeMode={themeMode}
              onThemeChange={setThemeMode}
              onCreate={() => setCreateTicket(nextTicketNumber(todos))}
              guideVisible={guideVisible}
              onShowGuide={() => setGuideOpen(true)}
              onAbout={() =>
                setDialog({
                  type: 'about',
                  title: 'About TODO BOARD',
                  body: 'A Kanban board for today’s work. Tasks are kept in this browser tab so a refresh keeps your board. Closing the tab clears the session for a clean start next time. Open-source and free to use under the MIT License.',
                })
              }
            />

            <KanbanBoard
              tasks={todos}
              onOpenTask={setSelectedId}
              onMove={handleMove}
            />

            {guideVisible ? (
              <DaySprintGuide onDismiss={() => setGuideOpen(false)} />
            ) : null}
          </div>

          <SiteFooter />
        </div>
      </div>

      <CreateTaskModal
        open={Boolean(createTicket)}
        tasks={todos}
        ticketNumber={createTicket}
        onClose={() => setCreateTicket(null)}
        onCreate={handleCreate}
      />

      <TaskDetailDialog
        open={Boolean(selectedTask)}
        task={selectedTask}
        tasks={todos}
        onClose={() => setSelectedId(null)}
        onUpdate={updateTask}
        onMove={handleMove}
        onRequestDelete={(taskId) =>
          setDialog({
            type: 'delete',
            title: 'Delete this task?',
            body: 'Subtasks will be kept and become top-level. Linked references to this task will be removed.',
            taskId,
          })
        }
      />

      <Dialog
        open={Boolean(dialog)}
        title={dialog?.title ?? ''}
        onClose={closeDialog}
        initialFocus="cancel"
        actions={
          dialog?.type === 'about' ? (
            <button
              type="button"
              className="btn btn-primary"
              data-focus="cancel"
              onClick={closeDialog}
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                data-focus="cancel"
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-focus="confirm"
                onClick={confirmDialog}
              >
                Delete
              </button>
            </>
          )
        }
      >
        {dialog?.body}
      </Dialog>

      <Toast message={toast?.message} variant={toast?.variant} />
    </div>
  )
}
