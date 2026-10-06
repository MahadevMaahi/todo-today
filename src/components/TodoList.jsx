import { useRef } from 'react'
import EmptyTips from './EmptyTips'
import TodoItem from './TodoItem'

export default function TodoList({
  todos,
  showEmptyTips,
  onToggle,
  onDelete,
  onRename,
  onReorder,
}) {
  const dragIndexRef = useRef(null)

  function handleDragStart(index) {
    dragIndexRef.current = index
  }

  function handleDragEnter(index) {
    const from = dragIndexRef.current
    if (from === null || from === index) return
    onReorder(from, index)
    dragIndexRef.current = index
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDragEnd() {
    dragIndexRef.current = null
  }

  return (
    <div className="todo-list-area">
      {showEmptyTips ? <EmptyTips /> : null}
      <ul className="todo-list">
        {todos.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onRename={onRename}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </ul>
    </div>
  )
}
