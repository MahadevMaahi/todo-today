export default function SprintProgress({ tasks }) {
  if (tasks.length === 0) return null

  const total = tasks.length
  const finished = tasks.filter((t) => t.status === 'finished').length
  const totalEffort = tasks.reduce((s, t) => s + (t.effort ?? 0), 0)
  const finishedEffort = tasks
    .filter((t) => t.status === 'finished')
    .reduce((s, t) => s + (t.effort ?? 0), 0)

  const pct = total > 0 ? Math.round((finished / total) * 100) : 0

  const taskLabel = `${finished} / ${total} task${total === 1 ? '' : 's'}`
  const effortLabel =
    totalEffort > 0 ? ` · ${finishedEffort}h / ${totalEffort}h` : ''

  return (
    <div className="sprint-progress" aria-label="Sprint progress">
      <div
        className="sprint-progress-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% complete`}
      >
        <div className="sprint-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="sprint-progress-label">
        {taskLabel}
        {effortLabel}
      </span>
    </div>
  )
}
