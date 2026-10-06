import { useId, useState } from 'react'
import './App.css'
import SidePanel from './components/SidePanel'
import SloganBar from './components/SloganBar'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'

const DEFAULT_SLOGAN = 'Act Now, Simplify Life.☕'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter((t) => !t.completed)
  if (filter === 'completed') return todos.filter((t) => t.completed)
  return todos
}

function normalizeImported(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.todos)
      ? raw.todos
      : null

  if (!list) return null

  return list
    .map((item) => {
      if (typeof item === 'string') {
        const title = item.trim()
        if (!title) return null
        return { id: createId(), title, completed: false }
      }
      if (item && typeof item === 'object') {
        const title = String(item.title ?? item.text ?? '').trim()
        if (!title) return null
        return {
          id: createId(),
          title,
          completed: Boolean(item.completed),
        }
      }
      return null
    })
    .filter(Boolean)
}

function exportFilename() {
  const date = new Date().toISOString().replace(/-|:|\.\d+/g, '')
  return `todos-${date.slice(0, 8)}-${date.slice(9, 15)}.json`
}

function App() {
  const [todos, setTodos] = useState([])
  const [draft, setDraft] = useState('')
  const [slogan, setSlogan] = useState(DEFAULT_SLOGAN)
  const [filter, setFilter] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const aboutId = useId()

  const visibleTodos = filterTodos(todos, filter)
  const remaining = todos.filter((t) => !t.completed).length
  const showEmptyTips = visibleTodos.length === 0

  function addTodo(rawTitle) {
    const title = String(rawTitle ?? draft).trim()
    if (!title) return
    setTodos((prev) => [
      { id: createId(), title, completed: false },
      ...prev,
    ])
    setDraft('')
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function renameTodo(id, title) {
    if (!title) {
      deleteTodo(id)
      return
    }
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t)),
    )
  }

  function reorderVisible(fromIndex, toIndex) {
    setTodos((prev) => {
      const visible = filterTodos(prev, filter)
      const fromTodo = visible[fromIndex]
      const toTodo = visible[toIndex]
      if (!fromTodo || !toTodo) return prev

      const next = [...prev]
      const fromFull = next.findIndex((t) => t.id === fromTodo.id)
      const toFull = next.findIndex((t) => t.id === toTodo.id)
      if (fromFull < 0 || toFull < 0 || fromFull === toFull) return prev

      const [moved] = next.splice(fromFull, 1)
      next.splice(toFull, 0, moved)
      return next
    })
  }

  function markAllDone() {
    setTodos((prev) => prev.map((t) => ({ ...t, completed: true })))
  }

  function finishAll() {
    markAllDone()
  }

  function clearAll() {
    if (todos.length === 0) return
    if (window.confirm('Confirm to clear all todo items?')) {
      setTodos([])
    }
  }

  function exportData() {
    const payload = JSON.stringify(todos, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = exportFilename()
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  async function importData(file) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text.trim())
      const items = normalizeImported(parsed)
      if (!items || items.length === 0) {
        window.alert('No valid todo items found in that file.')
        return
      }
      setTodos((prev) => [...items, ...prev])
    } catch {
      window.alert('Could not import file. Use a JSON array of todos.')
    }
  }

  function saveSlogan(next) {
    setSlogan(next || DEFAULT_SLOGAN)
  }

  return (
    <>
      <div className="bg-pattern" aria-hidden="true" />

      <nav className="nav">
        <a
          className="social-link"
          href="https://github.com/ricocc/uiineed-todo-list"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <svg
            className="ic-social"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.8 1.6 2.8 1.1.1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
            />
          </svg>
        </a>
        <button
          type="button"
          className="about-btn"
          aria-expanded={aboutOpen}
          aria-controls={aboutId}
          onClick={() => setAboutOpen((v) => !v)}
        >
          About
        </button>
        {aboutOpen ? (
          <div id={aboutId} className="about-panel" role="dialog">
            <p>
              Minimalist session-only todo list. Nothing is saved when you
              refresh or close this tab.
            </p>
            <button type="button" onClick={() => setAboutOpen(false)}>
              Close
            </button>
          </div>
        ) : null}
      </nav>

      <div className="todo-wrapper">
        <div className="todo-app">
          <header className="container header">
            <h1 className="title" aria-label="TODO">
              <span className="title-text">TODO</span>
              <span className="ani-vector" aria-hidden="true">
                <span />
                <span />
              </span>
            </h1>
            <TodoInput value={draft} onChange={setDraft} onSubmit={addTodo} />
          </header>

          <main className="container main">
            <div className="todo-list-box">
              <SloganBar
                slogan={slogan}
                onSloganChange={saveSlogan}
                onMarkAllDone={markAllDone}
              />

              <TodoList
                todos={visibleTodos}
                showEmptyTips={showEmptyTips}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onRename={renameTodo}
                onReorder={reorderVisible}
              />

              <div className="bar-message bar-bottom">
                <div className="bar-message-text">
                  <span>
                    {remaining} item{remaining === 1 ? '' : 's'} remaining
                  </span>
                </div>
              </div>
            </div>

            <SidePanel
              open={sidebarOpen}
              onToggle={() => setSidebarOpen((v) => !v)}
              filter={filter}
              onFilterChange={setFilter}
              onFinishAll={finishAll}
              onClearAll={clearAll}
              onExport={exportData}
              onImport={importData}
            />
          </main>
        </div>
      </div>
    </>
  )
}

export default App
