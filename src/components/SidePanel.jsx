import { useRef } from 'react'

export default function SidePanel({
  open,
  onToggle,
  filter,
  onFilterChange,
  onFinishAll,
  onClearAll,
  onExport,
  onImport,
}) {
  const fileRef = useRef(null)

  return (
    <aside className={`side-bar${open ? '' : ' fold'}`}>
      <div className="side-shortcut">
        <button
          type="button"
          className="shortcut-switch"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Collapse quick actions' : 'Open quick actions'}
        >
          <span className="shortcut-title">{open ? 'OPEN✨' : '＝'}</span>
          {!open ? <span className="shortcut-name">Quicks</span> : null}
        </button>
      </div>

      <div className="todo-footer-box">
        <ul className="todo-func-list filter">
          <li>
            <input
              type="button"
              value="All"
              className={`btn-small action-showAll${filter === 'all' ? ' selected' : ''}`}
              onClick={() => onFilterChange('all')}
            />
          </li>
          <li>
            <input
              type="button"
              value="Active"
              className={`btn-small action-progress${filter === 'active' ? ' selected' : ''}`}
              onClick={() => onFilterChange('active')}
            />
          </li>
          <li>
            <input
              type="button"
              value="Completed"
              className={`btn-small action-completed${filter === 'completed' ? ' selected' : ''}`}
              onClick={() => onFilterChange('completed')}
            />
          </li>
        </ul>

        <ul className="todo-func-list batch">
          <li>
            <input
              type="button"
              value="Finish all"
              className="btn-small completed-all"
              onClick={onFinishAll}
            />
          </li>
          <li>
            <input
              type="button"
              value="Clear All"
              className="btn-small clear-all"
              onClick={onClearAll}
            />
          </li>
        </ul>

        <ul className="todo-func-list datasave">
          <li>
            <input
              type="button"
              value="Export data"
              className="btn-small action-download"
              onClick={onExport}
            />
          </li>
          <li>
            <input
              type="button"
              value="Import(txt/json)"
              className="btn-small action-import"
              onClick={() => fileRef.current?.click()}
            />
          </li>
        </ul>

        <div className="side-tips">
          <p className="side-tips-title">Usage Tips</p>
          <ul>
            <li>Enter to add</li>
            <li>Double-click to edit</li>
            <li>Drag to reorder</li>
            <li>No saved data — session only</li>
          </ul>
          <div className="side-info-links">
            <a
              href="https://todo.uiineed.com/"
              target="_blank"
              rel="noreferrer"
            >
              Inspired by uiineed
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              About
            </a>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.txt,application/json,text/plain"
        className="visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImport(file)
          e.target.value = ''
        }}
      />
    </aside>
  )
}
