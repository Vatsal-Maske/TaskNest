import Note from "../models/note.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
  const { title, content, subjectId, tags } = req.body;

  if (!title) {
    throw new ApiError(400, "Note title is required");
  }

  const note = await Note.create({
    userId: req.user._id,
    subjectId,
    title,
    content,
    tags,
  });

  res.status(201).json({ success: true, note });
});

// @desc    Get all notes for the logged-in user
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ userId: req.user._id })
    .populate("subjectId", "name color")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: notes.length, notes });
});

// @desc    Get a single note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("subjectId", "name color");

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  res.status(200).json({ success: true, note });
});

// @desc    Update a note
// @route   PATCH /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  res.status(200).json({ success: true, note });
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  res.status(200).json({ success: true, message: "Note deleted successfully" });
});

export { createNote, getNotes, getNoteById, updateNote, deleteNote };
