import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");
const STORAGE_KEY = "fullstack-todo-app.todos";
const emptyTodoForm = { text: "", dueDate: "" };
const statusColumns = [
  { key: "todo", title: "Todo" },
  { key: "in-progress", title: "In Progress" },
  { key: "completed", title: "Completed" },
];

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

function normalizeTodo(todo) {
  const status = todo.status || (todo.completed ? "completed" : "todo");

  return {
    ...todo,
    _id: todo._id || createLocalId(),
    createdAt: todo.createdAt || new Date().toISOString(),
    dueDate: todo.dueDate || "",
    status,
    completed: status === "completed" || Boolean(todo.completed),
  };
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function getDueStatus(todo) {
  if (!todo.dueDate) return { label: "No due date", className: "neutral" };
  if (todo.status === "completed") return { label: "Completed", className: "done" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(todo.dueDate);
  due.setHours(0, 0, 0, 0);

  if (due < today) return { label: "Overdue", className: "danger" };
  if (due.getTime() === today.getTime()) return { label: "Due today", className: "warning" };
  return { label: "Upcoming", className: "good" };
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
  const [form, setForm] = React.useState(emptyTodoForm);
  const [editingId, setEditingId] = React.useState(null);
  const [editingForm, setEditingForm] = React.useState(emptyTodoForm);
  const [loading, setLoading] = React.useState(true);
  const [notice, setNotice] = React.useState("");
  const [usingLocalStorage, setUsingLocalStorage] = React.useState(false);

  const saveLocalTodos = React.useCallback((nextTodos) => {
    const normalizedTodos = nextTodos.map(normalizeTodo);
    setTodos(normalizedTodos);
    writeStoredTodos(normalizedTodos);
    setUsingLocalStorage(true);
    setNotice("Using browser storage because the database API is unavailable.");
  }, []);

  const fetchTodos = React.useCallback(async () => {
    try {
      setNotice("");
      const data = await requestJson(routes.list);
      setTodos(data.map(normalizeTodo));
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
    const trimmed = form.text.trim();
    if (!trimmed) return;
    const payload = { text: trimmed, dueDate: form.dueDate || null, status: "todo", completed: false };

    try {
      setNotice("");
      const createdTodo = await requestJson(routes.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setForm(emptyTodoForm);
      setTodos((current) => [normalizeTodo(createdTodo), ...current]);
      setUsingLocalStorage(false);
    } catch {
      const nextTodos = [normalizeTodo({ ...payload, _id: createLocalId() }), ...readStoredTodos()];
      setForm(emptyTodoForm);
      saveLocalTodos(nextTodos);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditingForm({ text: todo.text, dueDate: todo.dueDate ? todo.dueDate.slice(0, 10) : "" });
  };

  const updateTodo = async (event) => {
    event.preventDefault();
    const trimmed = editingForm.text.trim();
    if (!trimmed || !editingId) return;
    const currentTodo = todos.find((todo) => todo._id === editingId);
    const payload = {
      _id: editingId,
      text: trimmed,
      dueDate: editingForm.dueDate || null,
      status: currentTodo?.status || "todo",
      completed: Boolean(currentTodo?.completed),
    };

    try {
      setNotice("");
      const updatedTodo = await requestJson(routes.update, {
        method: usesLegacyBackend ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setTodos((current) =>
        current.map((todo) => (todo._id === editingId ? normalizeTodo(updatedTodo || { ...todo, ...payload }) : todo))
      );
      setUsingLocalStorage(false);
    } catch {
      const nextTodos = readStoredTodos().map((todo) =>
        todo._id === editingId ? normalizeTodo({ ...todo, ...payload }) : todo
      );
      saveLocalTodos(nextTodos);
    } finally {
      setEditingId(null);
      setEditingForm(emptyTodoForm);
    }
  };

  const updateTodoStatus = async (todo, status) => {
    const payload = {
      _id: todo._id,
      text: todo.text,
      dueDate: todo.dueDate || null,
      status,
      completed: status === "completed",
    };

    try {
      setNotice("");
      const updatedTodo = await requestJson(routes.update, {
        method: usesLegacyBackend ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setTodos((current) =>
        current.map((currentTodo) => (currentTodo._id === todo._id ? normalizeTodo(updatedTodo || payload) : currentTodo))
      );
      setUsingLocalStorage(false);
    } catch {
      const nextTodos = readStoredTodos().map((currentTodo) =>
        currentTodo._id === todo._id ? normalizeTodo({ ...currentTodo, ...payload }) : currentTodo
      );
      saveLocalTodos(nextTodos);
    }
  };

  const toggleComplete = (todo) => {
    updateTodoStatus(todo, todo.status === "completed" ? "todo" : "completed");
  };

  const groupedTodos = statusColumns.map((column) => ({
    ...column,
    todos: todos.filter((todo) => todo.status === column.key),
  }));

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
            value={form.text}
            onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
            placeholder="Add a new todo"
            aria-label="Todo text"
          />
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            aria-label="Due date"
          />
          <button type="submit">Add</button>
        </form>

        {notice && <p className={usingLocalStorage ? "notice" : "status"}>{notice}</p>}

        {loading ? (
          <p className="status">Loading todos...</p>
        ) : todos.length === 0 ? (
          <p className="status">No todos yet. Add your first one.</p>
        ) : (
          <div className="todo-board">
            {groupedTodos.map((column) => (
              <section className="todo-column" key={column.key}>
                <div className="column-heading">
                  <h2>{column.title}</h2>
                  <span>{column.todos.length}</span>
                </div>

                <div className="todo-list">
                  {column.todos.length === 0 ? (
                    <p className="empty-column">No tasks here.</p>
                  ) : (
                    column.todos.map((todo) => (
              <article className={`todo-item ${todo.completed ? "is-complete" : ""}`} key={todo._id}>
                {editingId === todo._id ? (
                  <form className="edit-form" onSubmit={updateTodo}>
                    <input
                      type="text"
                      value={editingForm.text}
                      onChange={(event) => setEditingForm((current) => ({ ...current, text: event.target.value }))}
                      aria-label="Edit todo text"
                    />
                    <input
                      type="date"
                      value={editingForm.dueDate}
                      onChange={(event) => setEditingForm((current) => ({ ...current, dueDate: event.target.value }))}
                      aria-label="Edit due date"
                    />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => {
                      setEditingId(null);
                      setEditingForm(emptyTodoForm);
                    }}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="todo-content">
                      <label className="todo-check">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleComplete(todo)}
                          aria-label={`Mark ${todo.text} as ${todo.completed ? "active" : "complete"}`}
                        />
                        <span>{todo.text}</span>
                      </label>
                      <div className="todo-meta">
                        <span>Created {formatDate(todo.createdAt)}</span>
                        <span>Due {formatDate(todo.dueDate)}</span>
                        <strong className={getDueStatus(todo).className}>{getDueStatus(todo).label}</strong>
                      </div>
                    </div>
                    <div className="actions">
                      {statusColumns
                        .filter((status) => status.key !== todo.status)
                        .map((status) => (
                          <button
                            type="button"
                            className="status-action"
                            key={status.key}
                            onClick={() => updateTodoStatus(todo, status.key)}
                          >
                            {status.title}
                          </button>
                        ))}
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
