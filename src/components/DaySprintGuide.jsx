const COLUMNS = [
  {
    name: 'Backlog',
    tip: 'Today’s short candidate list. Every new task starts here.',
  },
  {
    name: 'In Process',
    tip: 'Active focus. Prefer one task at a time to limit switching.',
  },
  {
    name: 'Blocked',
    tip: 'Waiting on a person, review, or decision—move it here honestly.',
  },
  {
    name: 'Finished',
    tip: 'Completed outcomes for the day. Your closing scoreboard.',
  },
]

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function DaySprintGuide({ onDismiss }) {
  return (
    <article className="guide" aria-labelledby="guide-heading">
      <button
        type="button"
        className="icon-btn guide-close"
        aria-label="Hide how-to guide"
        onClick={onDismiss}
      >
        <CloseIcon />
      </button>

      <header className="guide-header">
        <h2 id="guide-heading" className="guide-title">
          Free day-sprint task board — how to use TODO BOARD
        </h2>
        <p className="guide-lead">
          TODO BOARD is a free, no-login Kanban board for one-day productivity
          sprints. Create only what you can finish today, prioritize with P0–P3,
          and move work from Backlog to Finished. A refresh keeps this browser
          tab’s session; closing the tab clears it so tomorrow starts clean.
        </p>
        <p className="guide-hint">
          Prefer a quieter board? Close this guide with the × control. You can
          open it again anytime from the menu (⋯ → Show how-to guide).
        </p>
      </header>

      <section className="guide-section" aria-labelledby="guide-flow">
        <h3 id="guide-flow" className="guide-subtitle">
          Board flow
        </h3>
        <ul className="guide-columns">
          {COLUMNS.map((col) => (
            <li key={col.name} className="guide-column">
              <strong>{col.name}</strong>
              <span>{col.tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="guide-section" aria-labelledby="guide-rules-heading">
        <h3 id="guide-rules-heading" className="guide-subtitle">
          Rules that keep the board honest
        </h3>
        <ul className="guide-rules">
          <li>
            <strong>Priority</strong> — P0 is for true day-breakers; use P1–P3 for
            lower urgency.
          </li>
          <li>
            <strong>Parent / child</strong> — a parent cannot move to Finished until
            every direct child is Finished.
          </li>
          <li>
            <strong>Blocked child</strong> — blocking a child also blocks its
            parent so nothing looks done while work is stuck.
          </li>
          <li>
            <strong>Tickets & links</strong> — each task gets a TD-n id; link related
            work, add effort hours and notes when useful.
          </li>
        </ul>
      </section>

      <section className="guide-section" aria-labelledby="guide-start">
        <h3 id="guide-start" className="guide-subtitle">
          Quick start
        </h3>
        <ol className="guide-steps">
          <li>Click Create and add today’s tasks with honest priorities.</li>
          <li>Pull one P0/P1 into In Process; park waits in Blocked.</li>
          <li>Finish children before parents, then close the day in Finished.</li>
        </ol>
      </section>
    </article>
  )
}
