import { useEffect, useRef, useState } from 'react'
import './App.css'
import AppNav from './components/AppNav'
import CreateTaskModal from './components/CreateTaskModal'
import DaySprintGuide from './components/DaySprintGuide'
import Dialog from './components/Dialog'
import ImportDialog from './components/ImportDialog'
import KanbanBoard from './components/KanbanBoard'
import SiteFooter from './components/SiteFooter'
import SprintProgress from './components/SprintProgress'
import TaskDetailDialog from './components/TaskDetailDialog'
import Toast from './components/Toast'
import { nextTicketNumber } from './todos/model'
import { exportTasks } from './todos/storage'
import { useTodos } from './todos/useTodos'
import { applyTheme } from './theme'

const GUIDE_VISIBLE_KEY = 'todo-today.guideVisible'
const THEME_MODE_KEY = 'todo-today.themeMode'

function readGuideVisible() {
  try {
    const stored = localStorage.getItem(GUIDE_VISIBLE_KEY)
    if (stored === null) return true
    return stored === '1'
  } catch {
    return true
  }
}

function writeGuideVisible(visible) {
  try {
    localStorage.setItem(GUIDE_VISIBLE_KEY, visible ? '1' : '0')
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function readThemeMode() {
  try {
    return localStorage.getItem(THEME_MODE_KEY) ?? 'system'
  } catch {
    return 'system'
  }
}

function writeThemeMode(mode) {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode)
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
  return "Couldn't move that task."
}

export default function App() {
  const [themeMode, setThemeMode] = useState(readThemeMode)
  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [createTicket, setCreateTicket] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [guideVisible, setGuideVisible] = useState(readGuideVisible)
  const [importOpen, setImportOpen] = useState(false)
  // Track whether tasks have been exported this session for the save banner.
  const [exportedThisSession, setExportedThisSession] = useState(false)
  const toastTimer = useRef(null)

  function setGuideOpen(visible) {
    setGuideVisible(visible)
    writeGuideVisible(visible)
  }

  function handleThemeChange(mode) {
    setThemeMode(mode)
    writeThemeMode(mode)
  }

  const {
    todos,
    storageError,
    clearStorageError,
    createTask,
    moveTask,
    updateTask,
    deleteTask,
    importTasks,
    undoLast,
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

  // Cmd+K / Ctrl+K global shortcut to open Create dialog.
  // Cmd+Z / Ctrl+Z undo last action.
  useEffect(() => {
    function onKeyDown(e) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k' && !dialog && !createTicket && !selectedId) {
        e.preventDefault()
        setCreateTicket(nextTicketNumber(todos))
        return
      }
      if (mod && e.key === 'z' && !dialog && !createTicket && !selectedId) {
        e.preventDefault()
        const result = undoLast()
        if (result.ok) showToast('Undid last action.')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dialog, createTicket, selectedId, todos, undoLast])

  // Warn before unload when there are unsaved tasks and no export this session.
  useEffect(() => {
    if (todos.length === 0 || exportedThisSession) return undefined
    function onBeforeUnload(e) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [todos.length, exportedThisSession])

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

  function handleExport() {
    exportTasks(todos)
    setExportedThisSession(true)
    showToast('Tasks exported.')
  }

  function handleImport(raw) {
    const result = importTasks(raw)
    if (result.ok) {
      showToast(`Imported ${result.count} task${result.count === 1 ? '' : 's'}.`)
      setExportedThisSession(false)
    }
    return result
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <div className="app-column">
          <div className="app-column-body">
            <AppNav
              themeMode={themeMode}
              onThemeChange={handleThemeChange}
              onCreate={() => setCreateTicket(nextTicketNumber(todos))}
              onExport={handleExport}
              onImport={() => setImportOpen(true)}
              guideVisible={guideVisible}
              onShowGuide={() => setGuideOpen(true)}
              onAbout={() =>
                setDialog({
                  type: 'about',
                  title: 'About TODO BOARD',
                  body: "A Kanban board for today’s work. Tasks are kept in this browser tab so a refresh keeps your board. Closing the tab clears the session for a clean start next time. Open-source and free to use under the MIT License.",
                })
              }
            />

            {todos.length > 0 && !exportedThisSession ? (
              <div className="save-banner" role="note">
                <span className="save-banner-text">
                  Tasks live only in this tab — export to save your work
                </span>
                <button
                  type="button"
                  className="btn btn-ghost save-banner-btn"
                  onClick={handleExport}
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  className="icon-btn save-banner-dismiss"
                  aria-label="Dismiss"
                  onClick={() => setExportedThisSession(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : null}

            <SprintProgress tasks={todos} />

            <KanbanBoard
              tasks={todos}
              onOpenTask={setSelectedId}
              onMove={handleMove}
              onAddTask={() => setCreateTicket(nextTicketNumber(todos))}
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

      <ImportDialog
        open={importOpen}
        currentCount={todos.length}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <Toast message={toast?.message} variant={toast?.variant} />
    </div>
  )
}
