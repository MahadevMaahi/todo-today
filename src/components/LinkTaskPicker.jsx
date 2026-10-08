import { useId, useMemo, useState } from 'react'
import { formatTaskOption } from '../todos/model'

/**
 * Searchable, scrollable multi-select for linking tickets.
 */
export default function LinkTaskPicker({
  tasks,
  selectedIds,
  onChange,
  excludeId = null,
  label = 'Linked task(s)',
}) {
  const labelId = useId()
  const searchId = useId()
  const [query, setQuery] = useState('')

  const candidates = useMemo(
    () => tasks.filter((t) => t.id !== excludeId),
    [tasks, excludeId],
  )

  const selected = useMemo(
    () =>
      selectedIds
        .map((id) => candidates.find((t) => t.id === id))
        .filter(Boolean),
    [selectedIds, candidates],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter((t) => {
      const hay = `${t.ticketNumber} ${t.title}`.toLowerCase()
      return hay.includes(q)
    })
  }, [candidates, query])

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id) {
    onChange(selectedIds.filter((x) => x !== id))
  }

  if (candidates.length === 0) return null

  return (
    <div className="link-picker">
      <div className="link-picker-header">
        <span className="form-label-text" id={labelId}>
          {label}
        </span>
        {selected.length > 0 ? (
          <span className="link-picker-count">{selected.length} selected</span>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <ul className="link-chip-list" aria-label="Selected linked tasks">
          {selected.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="link-chip"
                onClick={() => remove(t.id)}
                aria-label={`Remove link ${formatTaskOption(t)}`}
              >
                <span className="ticket-badge">{t.ticketNumber}</span>
                <span className="link-chip-title">{t.title}</span>
                <span className="link-chip-remove" aria-hidden="true">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label htmlFor={searchId} className="visually-hidden">
        Search tasks to link
      </label>
      <input
        id={searchId}
        type="search"
        className="link-picker-search"
        placeholder="Search by ticket or title…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      <ul
        className="link-picker-list"
        role="group"
        aria-labelledby={labelId}
      >
        {filtered.length === 0 ? (
          <li className="link-picker-empty">No matching tasks</li>
        ) : (
          filtered.map((t) => {
            const checked = selectedIds.includes(t.id)
            return (
              <li key={t.id}>
                <label className={`link-picker-row${checked ? ' is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(t.id)}
                  />
                  <span className="ticket-badge">{t.ticketNumber}</span>
                  <span className="link-picker-title">{t.title}</span>
                </label>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
