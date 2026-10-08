import { useEffect, useId, useRef } from 'react'

function getFocusable(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export default function Dialog({
  open,
  title,
  children,
  onClose,
  actions,
  initialFocus = 'cancel',
  className = '',
}) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement
    const node = dialogRef.current

    function focusInitial() {
      const focusables = getFocusable(node)
      let preferred
      if (initialFocus === 'confirm') {
        preferred = focusables.find((el) => el.dataset.focus === 'confirm')
      } else if (initialFocus === 'field') {
        preferred = focusables.find((el) => el.dataset.focus === 'field')
      } else {
        preferred = focusables.find((el) => el.dataset.focus === 'cancel')
      }
      ;(preferred ?? focusables[0])?.focus()
    }

    // Only set initial focus when the dialog opens — not on every parent re-render.
    focusInitial()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const focusables = getFocusable(node)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
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
  }, [open, initialFocus])

  if (!open) return null

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={`dialog${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        <div className="dialog-body">{children}</div>
        {actions ? <div className="dialog-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
