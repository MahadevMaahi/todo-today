import { useEffect, useRef } from 'react'

export default function Menu({
  open,
  onClose,
  labelledBy,
  children,
}) {
  const menuRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement
    const items = () =>
      Array.from(
        menuRef.current?.querySelectorAll(
          '[role="menuitem"]:not([disabled]), button.menu-theme-btn:not([disabled])',
        ) ?? [],
      )

    const first = items()[0]
    first?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      const list = items()
      if (list.length === 0) return

      const index = list.indexOf(document.activeElement)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = index < 0 ? 0 : (index + 1) % list.length
        list[next].focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = index < 0 ? list.length - 1 : (index - 1 + list.length) % list.length
        list[next].focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        list[0].focus()
      } else if (e.key === 'End') {
        e.preventDefault()
        list[list.length - 1].focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (
        previouslyFocused.current &&
        typeof previouslyFocused.current.focus === 'function'
      ) {
        previouslyFocused.current.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="menu-backdrop"
        aria-hidden="true"
        onMouseDown={onClose}
      />
      <div
        ref={menuRef}
        className="menu"
        role="menu"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </>
  )
}

export function MenuItem({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      className="menu-item"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <hr className="menu-separator" />
}
