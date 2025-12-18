import { useState, useEffect } from "react";
import { DUMMY_TODOS } from "../constants/dummy_todos";

export function useTodos(userId) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodos = async () => {
    const trimmedUserId = userId?.trim();
    if (!trimmedUserId) {
      setError("Please enter a user ID to fetch todos.");
      setTodos(DUMMY_TODOS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/todos/", {
        headers: {
          "X-User-ID": trimmedUserId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setTodos(data.length > 0 ? data : DUMMY_TODOS);
    } catch (err) {
      console.warn("Fetch failed:", err);
      setError("Unable to connect to server. Showing demo data.");
      setTodos(DUMMY_TODOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [userId]);

  const addTodo = async (description) => {
    const trimmedUserId = userId?.trim();
    if (!trimmedUserId) {
      throw new Error("Please enter a user ID before adding todos.");
    }

    try {
      const response = await fetch("http://localhost:8000/todos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": trimmedUserId,
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add todo");
      }

      await fetchTodos(); 
    } catch (err) {
      
      const optimalTodo = {
        _id: Date.now().toString(),
        description,
        completed: false,
        user_id: trimmedUserId,
      };
      setTodos((prev) => [optimalTodo, ...prev]);
      throw err; 
    }
  };

  const toggleTodoComplete = async (todoId, currentCompleted) => {
    const trimmedUserId = userId?.trim();
    if (!trimmedUserId) {
      throw new Error("User ID is required");
    }


    setTodos((prev) =>
      prev.map((t) =>
        t._id === todoId ? { ...t, completed: !currentCompleted } : t
      )
    );

    try {
      const response = await fetch("http://localhost:8000/todos/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": trimmedUserId,
        },
        body: JSON.stringify({
          id: todoId,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update todo");
      }

      const updatedTodo = await response.json();
      setTodos((prev) =>
        prev.map((t) => (t._id === updatedTodo._id ? updatedTodo : t))
      );
    } catch (err) {
      setTodos((prev) =>
        prev.map((t) =>
          t._id === todoId ? { ...t, completed: currentCompleted } : t
        )
      );
      throw err;
    }
  };

  const deleteTodoById = async (todoId) => {
    const trimmedUserId = userId?.trim();
    if (!trimmedUserId) {
      throw new Error("User ID is required");
    }

    setTodos((prev) => prev.filter((t) => t._id !== todoId));

    try {
      const response = await fetch("http://localhost:8000/todos/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": trimmedUserId,
        },
        body: JSON.stringify({ id: todoId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete todo");
      }

    } catch (err) {
      await fetchTodos(); 
      throw err;
    }
  };

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodoComplete,
    deleteTodoById,
    refetch: fetchTodos,
  };
}
