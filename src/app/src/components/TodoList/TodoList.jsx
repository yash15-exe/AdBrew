import { useState } from "react";
import "./TodoList.css";

export default function TodoList({
  todos,
  loading,
  error,
  toggleTodoComplete,
  deleteTodoById,
}) {
  const [processingId, setProcessingId] = useState(null);

  const handleToggle = async (todo) => {
    setProcessingId(todo._id);
    try {
      await toggleTodoComplete(todo._id, todo.completed);
    } catch (err) {
      alert("Failed to toggle: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (todoId) => {
    if (!confirm("Delete this todo permanently?")) return; // ← Added confirm back!

    setProcessingId(todoId);
    try {
      await deleteTodoById(todoId);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading)
    return <div className="todo-list__message">Loading todos...</div>;
  if (error)
    return (
      <div className="todo-list__message todo-list__message--error">
        {error}
      </div>
    );
  if (todos.length === 0)
    return (
      <div className="todo-list__message">No todos yet. Add one above!</div>
    );

  return (
    <div className="todo-list">
      <h2 className="todo-list__title">List of TODOs</h2>

      <div className="todo-list__scroll-container">
        <ul className="todo-list__items">
          {todos.map((todo, index) => (
            <li
              key={todo._id}
              className={`todo-list__item ${
                todo.completed ? "todo-list__item--completed" : ""
              }`}
            >
              <span className="todo-list__number">{index + 1}.</span>

              <span className="todo-list__description">{todo.description}</span>

              <div className="todo-list__actions">
                <button
                  onClick={() => handleToggle(todo)}
                  disabled={processingId === todo._id}
                  className="todo-list__toggle-btn"
                >
                  {processingId === todo._id
                    ? "..."
                    : todo.completed
                    ? "✓ Done"
                    : "○ Mark Done"}
                </button>

                <button
                  onClick={() => handleDelete(todo._id)}
                  disabled={processingId === todo._id}
                  className="todo-list__delete-btn"
                >
                  {processingId === todo._id ? "..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
