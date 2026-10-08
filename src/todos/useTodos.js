import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTask as createTaskModel,
  deleteTask as deleteTaskModel,
  moveTask as moveTaskModel,
  updateTask as updateTaskModel,
} from './model.js'
import { loadTasks, saveTasks } from './storage.js'

export function useTodos() {
  const [todos, setTodos] = useState(() => loadTasks())
  const [storageError, setStorageError] = useState(null)
  const skipNextSave = useRef(true)
  const clearStorageError = useCallback(() => {
    setStorageError(null)
  }, [])

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    const result = saveTasks(todos)
    const nextError = result.ok
      ? null
      : 'Couldn’t save tasks for this browser tab.'
    setStorageError((prev) => (prev === nextError ? prev : nextError))
  }, [todos])

  /**
   * @param {Parameters<typeof createTaskModel>[1]} input
   */
  function createTask(input) {
    const result = createTaskModel(todos, input)
    if (result.ok) {
      setTodos(result.tasks)
    }
    return result
  }

  /**
   * @param {string} id
   * @param {import('./model.js').Status} status
   */
  function moveTask(id, status) {
    let result
    setTodos((prev) => {
      result = moveTaskModel(prev, id, status)
      return result.ok ? result.tasks : prev
    })
    return result
  }

  /**
   * @param {string} id
   * @param {Parameters<typeof updateTaskModel>[2]} patch
   */
  function updateTask(id, patch) {
    let result
    setTodos((prev) => {
      result = updateTaskModel(prev, id, patch)
      return result.ok ? result.tasks : prev
    })
    return result
  }

  /**
   * @param {string} id
   */
  function deleteTask(id) {
    let result
    setTodos((prev) => {
      result = deleteTaskModel(prev, id)
      return result.ok ? result.tasks : prev
    })
    return result
  }

  return {
    todos,
    storageError,
    clearStorageError,
    createTask,
    moveTask,
    updateTask,
    deleteTask,
  }
}
