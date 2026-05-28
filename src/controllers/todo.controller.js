import Todo from "../models/todo.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
const createTodo = asyncHandler(async (req, res) => {
  const { title, description, subjectId, priority, status, dueDate } = req.body;

  if (!title) {
    throw new ApiError(400, "Todo title is required");
  }

  const todo = await Todo.create({
    userId: req.user._id,
    subjectId,
    title,
    description,
    priority,
    status,
    dueDate,
  });

  res.status(201).json({ success: true, todo });
});

// @desc    Get all todos for the logged-in user
// @route   GET /api/todos
// @access  Private
const getTodos = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ userId: req.user._id })
    .populate("subjectId", "name color") // Populate subject name and color
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: todos.length, todos });
});

// @desc    Get a single todo by ID
// @route   GET /api/todos/:id
// @access  Private
const getTodoById = asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("subjectId", "name color");

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  res.status(200).json({ success: true, todo });
});

// @desc    Update a todo
// @route   PATCH /api/todos/:id
// @access  Private
const updateTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  res.status(200).json({ success: true, todo });
});

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  res.status(200).json({ success: true, message: "Todo deleted successfully" });
});

export { createTodo, getTodos, getTodoById, updateTodo, deleteTodo };
