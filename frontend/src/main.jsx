import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");
const STORAGE_KEY = "fullstack-todo-app.todos";

const apiPath = (path) => `${API_BASE_URL}${path}`;
const usesLegacyBackend = Boolean(API_BASE_URL);

const routes = usesLegacyBackend
  ? {
      list: "/get",
      create: "/save",
      update: "/update",
      delete: "/delete",
    }
  : {
      list: "/api/todos",
      create: "/api/todos",
      update: "/api/todos",
      delete: "/api/todos",
    };

function createLocalId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStoredTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStoredTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

async function requestJson(path, options = {}) {
  const response = await fetch(apiPath(path), options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

function App() {
  const [todos, setTodos] = React.useState([]);
  const [text, setText] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);
  const [editingText, setEditingText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [notice, setNotice] = React.useState("");
  const [usingLocalStorage, setUsingLocalStorage] = React.useState(false);

  const saveLocalTodos = React.useCallback((nextTodos) => {
    setTodos(nextTodos);
    writeStoredTodos(nextTodos);
    setUsingLocalStorage(true);
    setNotice("Using browser storage because the database API is unavailable.");
  }, []);

  const fetchTodos = React.useCallback(async () => {
    try {
      setNotice("");
      const data = await requestJson(routes.list);
      setTodos(data);
      setUsingLocalStorage(false);
    } catch {
      saveLocalTodos(readStoredTodos());
    } finally {
      setLoading(false);
    }
  }, [saveLocalTodos]);

  React.useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setNotice("");
      const createdTodo = await requestJson(routes.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      setText("");
      setTodos((current) => [createdTodo, ...current]);
      setUsingLocalStorage(false);
    } catch {
      const nextTodos = [{ _id: createLocalId(), text: trimmed }, ...readStoredTodos()];
      setText("");
      saveLocalTodos(nextTodos);
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
      setNotice("");
      const updatedTodo = await requestJson(routes.update, {
        method: usesLegacyBackend ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: editingId, text: trimmed }),
      });
      setTodos((current) =>
        current.map((todo) => (todo._id === editingId ? updatedTodo || { ...todo, text: trimmed } : todo))
      );
      setUsingLocalStorage(false);
    } catch {
      const nextTodos = readStoredTodos().map((todo) =>
        todo._id === editingId ? { ...todo, text: trimmed } : todo
      );
      saveLocalTodos(nextTodos);
    } finally {
      setEditingId(null);
      setEditingText("");
    }
  };

  const deleteTodo = async (_id) => {
    try {
      setNotice("");
      await requestJson(routes.delete, {
        method: usesLegacyBackend ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id }),
      });
      setTodos((current) => current.filter((todo) => todo._id !== _id));
      setUsingLocalStorage(false);
    } catch {
      const nextTodos = readStoredTodos().filter((todo) => todo._id !== _id);
      saveLocalTodos(nextTodos);
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

        {notice && <p className={usingLocalStorage ? "notice" : "status"}>{notice}</p>}

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
