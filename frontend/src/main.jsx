import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [todos, setTodos] = React.useState([]);
  const [text, setText] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);
  const [editingText, setEditingText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchTodos = React.useCallback(async () => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/get`);
      if (!response.ok) throw new Error("Unable to load todos");
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!response.ok) throw new Error("Unable to add todo");
      setText("");
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditingText(todo.text);
  };

  const updateTodo = async (event) => {
    event.preventDefault();
    const trimmed = editingText.trim();
    if (!trimmed || !editingId) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: editingId, text: trimmed }),
      });
      if (!response.ok) throw new Error("Unable to update todo");
      setEditingId(null);
      setEditingText("");
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTodo = async (_id) => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id }),
      });
      if (!response.ok) throw new Error("Unable to delete todo");
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app-shell">
      <section className="todo-panel">
        <div className="heading">
          <p>Fullstack MERN</p>
          <h1>Todo App</h1>
        </div>

        <form className="todo-form" onSubmit={addTodo}>
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add a new todo"
            aria-label="Todo text"
          />
          <button type="submit">Add</button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="todo-list">
          {loading ? (
            <p className="status">Loading todos...</p>
          ) : todos.length === 0 ? (
            <p className="status">No todos yet. Add your first one.</p>
          ) : (
            todos.map((todo) => (
              <article className="todo-item" key={todo._id}>
                {editingId === todo._id ? (
                  <form className="edit-form" onSubmit={updateTodo}>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      aria-label="Edit todo text"
                    />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{todo.text}</span>
                    <div className="actions">
                      <button type="button" onClick={() => startEdit(todo)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteTodo(todo._id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
