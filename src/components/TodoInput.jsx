export default function TodoInput({ value, onChange, onSubmit }) {
  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = String(formData.get('title') ?? value).trim()
    onSubmit(title)
  }

  return (
    <form className="add-content-wrapper" onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        className="add-content"
        placeholder="Add a to-do item..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Add a to-do item"
      />
      <button type="submit" className="btn submit-btn">
        Add
      </button>
    </form>
  )
}
