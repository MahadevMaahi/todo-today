import { useEffect, useRef, useState } from 'react'

export default function InlineEdit({
  value,
  onSave,
  className = '',
  inputClassName = '',
  as: Tag = 'div',
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEditing() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    const next = draft.trim()
    setEditing(false)
    onSave(next)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={inputClassName}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
      />
    )
  }

  return (
    <Tag
      className={className}
      onDoubleClick={startEditing}
      title="Double-click to edit"
    >
      {value}
    </Tag>
  )
}
