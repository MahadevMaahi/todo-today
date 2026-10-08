export default function Toast({ message, variant = 'info' }) {
  if (!message) return null

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <div
        className={`toast${variant === 'error' ? ' toast-error' : ''}`}
        role="status"
      >
        {message}
      </div>
    </div>
  )
}
