import InlineEdit from './InlineEdit'

export default function SloganBar({ slogan, onSloganChange, onMarkAllDone }) {
  return (
    <div className="bar-message">
      <button
        type="button"
        className="btn btn-label btn-allFinish"
        onClick={onMarkAllDone}
      >
        Mark All Done
      </button>
      <div className="slogan-wrap">
        <InlineEdit
          value={slogan}
          onSave={onSloganChange}
          className="bar-message-text"
          inputClassName="slogan-input"
        />
      </div>
    </div>
  )
}
