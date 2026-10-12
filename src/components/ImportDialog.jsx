import { useRef, useState } from 'react'
import Dialog from './Dialog'

/**
 * Modal for importing a JSON export file or pasted JSON.
 * Props:
 *   open          - whether the dialog is visible
 *   currentCount  - number of tasks currently on the board (for replace warning)
 *   onClose       - called when the dialog should close
 *   onImport(raw) - called with parsed JSON; returns { ok, count?, reason? }
 */
export default function ImportDialog({ open, currentCount, onClose, onImport }) {
  const [mode, setMode] = useState('file') // 'file' | 'paste'
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState(null)
  // When currentCount > 0, we ask the user to confirm before replacing.
  const [pendingRaw, setPendingRaw] = useState(null)
  const fileInputRef = useRef(null)

  function reset() {
    setMode('file')
    setPasteText('')
    setError(null)
    setPendingRaw(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function attemptImport(rawText) {
    setError(null)
    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      setError("Couldn't read that — make sure it's valid JSON.")
      return
    }
    if (currentCount > 0) {
      // Show replace confirmation before committing.
      setPendingRaw(parsed)
    } else {
      commit(parsed)
    }
  }

  function commit(raw) {
    const result = onImport(raw)
    if (!result.ok) {
      setPendingRaw(null)
      setError("Couldn't read that file — make sure it's a TODO Board export.")
    } else {
      handleClose()
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => attemptImport(ev.target.result)
    reader.onerror = () => setError('Failed to read the file.')
    reader.readAsText(file)
  }

  function handlePasteSubmit(e) {
    e.preventDefault()
    if (!pasteText.trim()) return
    attemptImport(pasteText)
  }

  // Confirmation screen shown when the board has existing tasks.
  if (pendingRaw) {
    return (
      <Dialog
        open={open}
        title="Replace current tasks?"
        onClose={() => setPendingRaw(null)}
        initialFocus="cancel"
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              data-focus="cancel"
              onClick={() => setPendingRaw(null)}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-danger"
              data-focus="confirm"
              onClick={() => commit(pendingRaw)}
            >
              Replace {currentCount} task{currentCount === 1 ? '' : 's'}
            </button>
          </>
        }
      >
        This will replace your current {currentCount} task
        {currentCount === 1 ? '' : 's'} with the imported data. This
        cannot be undone.
        {error ? <p className="import-error">{error}</p> : null}
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      title="Import tasks"
      onClose={handleClose}
      initialFocus="field"
      actions={
        mode === 'paste' ? (
          <>
            <button
              type="button"
              className="btn btn-ghost"
              data-focus="cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="import-paste-form"
              className="btn btn-primary"
            >
              Import
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            data-focus="cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
        )
      }
    >
      <div className="import-dialog-body">
        <div className="import-mode-tabs" role="tablist" aria-label="Import method">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'file'}
            className={`import-tab${mode === 'file' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('file')
              setError(null)
            }}
          >
            Upload file
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'paste'}
            className={`import-tab${mode === 'paste' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('paste')
              setError(null)
            }}
          >
            Paste JSON
          </button>
        </div>

        {mode === 'file' ? (
          <div className="import-file-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              data-focus="field"
              onChange={handleFileChange}
              className="import-file-input"
            />
            <p className="import-hint">
              Select a <code>.json</code> file exported from TODO Board.
            </p>
          </div>
        ) : (
          <form
            id="import-paste-form"
            className="import-paste-area"
            onSubmit={handlePasteSubmit}
          >
            <textarea
              data-focus="field"
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value)
                setError(null)
              }}
              placeholder={'{"tasks": [...]}'}
              className="import-paste-textarea"
              rows={6}
              spellCheck={false}
            />
          </form>
        )}

        {error ? <p className="import-error">{error}</p> : null}
      </div>
    </Dialog>
  )
}
