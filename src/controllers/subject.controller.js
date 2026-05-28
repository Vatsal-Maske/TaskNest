import Subject from "../models/subject.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    throw new ApiError(400, "Subject name is required");
  }

  const subject = await Subject.create({
    userId: req.user._id, // Associate with logged-in user
    name,
    description,
    color,
  });

  res.status(201).json({ success: true, subject });
});

// @desc    Get all subjects for the logged-in user
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({ success: true, count: subjects.length, subjects });
});

// @desc    Get a single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({
    _id: req.params.id,
    userId: req.user._id, // Ensure the subject belongs to the user
  });

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  res.status(200).json({ success: true, subject });
});

// @desc    Update a subject
// @route   PATCH /api/subjects/:id
// @access  Private
const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true } // Return updated doc, run schema validators
  );

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  res.status(200).json({ success: true, subject });
});

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  res.status(200).json({ success: true, message: "Subject deleted successfully" });
});

export { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject };
