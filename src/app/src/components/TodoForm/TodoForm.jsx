import { useState } from "react";
import "./TodoForm.css";

export default function TodoForm({ onAddTodo }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Todo description cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onAddTodo(description);
      setDescription("");
    } catch (error) {
      console.error("Failed to add todo:", error);
      setError(error.message || "Failed to add todo. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="todo-form">
      <h2 className="todo-form__title">Create a ToDo</h2>
      {error && <div className="todo-form__error">{error}</div>}
      <form onSubmit={handleSubmit} className="todo-form__form">
        <div className="todo-form__field">
          <label htmlFor="todo-input">ToDo:</label>
          <textarea
            id="todo-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter todo description"
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !description.trim()}>
          {loading ? "Adding..." : "Add ToDo!"}
        </button>
      </form>
    </div>
  );
}
