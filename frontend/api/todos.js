import mongoose from "mongoose";

let connectionPromise;

const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
    },
  },
  { timestamps: true }
);

const Todo = mongoose.models.ToDo || mongoose.model("ToDo", todoSchema);

async function connectDatabase() {
  if (mongoose.connection.readyState >= 1) return;

  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured");
  }

  connectionPromise ||= mongoose.connect(process.env.MONGODB_URL);
  await connectionPromise;
}

function sendError(res, error, status = 500) {
  res.status(status).json({ message: error.message || "Something went wrong" });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    await connectDatabase();

    if (req.method === "GET") {
      const todos = await Todo.find().sort({ createdAt: -1 });
      return res.status(200).json(todos);
    }

    if (req.method === "POST") {
      const text = req.body?.text?.trim();
      if (!text) return sendError(res, new Error("Todo text is required"), 400);
      const status = req.body?.status || "todo";

      const todo = await Todo.create({
        text,
        dueDate: req.body?.dueDate || null,
        status,
        completed: status === "completed",
      });
      return res.status(201).json(todo);
    }

    if (req.method === "PATCH") {
      const { _id } = req.body || {};
      const text = req.body?.text?.trim();
      if (!_id || !text) return sendError(res, new Error("Todo id and text are required"), 400);
      const updates = {
        text,
        dueDate: req.body?.dueDate || null,
      };

      if (req.body?.status) {
        updates.status = req.body.status;
        updates.completed = req.body.status === "completed";
      }

      if (typeof req.body?.completed === "boolean") {
        updates.completed = req.body.completed;
        updates.status = req.body.completed ? "completed" : updates.status || "todo";
      }

      const todo = await Todo.findByIdAndUpdate(
        _id,
        updates,
        { new: true, runValidators: true }
      );
      if (!todo) return sendError(res, new Error("Todo not found"), 404);

      return res.status(200).json(todo);
    }

    if (req.method === "DELETE") {
      const { _id } = req.body || {};
      if (!_id) return sendError(res, new Error("Todo id is required"), 400);

      const todo = await Todo.findByIdAndDelete(_id);
      if (!todo) return sendError(res, new Error("Todo not found"), 404);

      return res.status(204).end();
    }

    res.setHeader("Allow", "GET,POST,PATCH,DELETE,OPTIONS");
    return sendError(res, new Error("Method not allowed"), 405);
  } catch (error) {
    return sendError(res, error);
  }
}
