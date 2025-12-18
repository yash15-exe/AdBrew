import { useState } from "react";
import { TodoForm, TodoList } from "./components";
import { useTodos } from "./hooks/useTodos";
import "./App.css";

function App() {
  const [userId, setUserId] = useState("little-crazy-yash");

  const { todos, loading, error, addTodo, toggleTodoComplete, deleteTodoById } = useTodos(
    userId.trim()
  );

  return (
    <>
      <div className="App">
        <div className="user-panel">
          <h2>User Settings</h2>
          <div className="user-id-section">
            <label htmlFor="user-id-input">Enter User ID:</label>
            <input
              id="user-id-input"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., user123"
            />
          </div>

          <div className="current-user">
            Current User: <strong>{userId.trim() || "(none)"}</strong>
          </div>
          <TodoForm onAddTodo={addTodo} />
        </div>

        <div className="todos-panel">
          <TodoList
            todos={todos}
            loading={loading}
            error={error}
            toggleTodoComplete={toggleTodoComplete}
            deleteTodoById={deleteTodoById}
          />
        </div>
      </div>
    </>
  );
}

export default App;
