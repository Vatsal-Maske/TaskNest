import Exam from "../models/exam.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private
const createExam = asyncHandler(async (req, res) => {
  const { title, examDate, syllabus, subjectId, status } = req.body;

  if (!title || !examDate) {
    throw new ApiError(400, "Title and exam date are required");
  }

  const exam = await Exam.create({
    userId: req.user._id,
    subjectId,
    title,
    examDate,
    syllabus,
    status,
  });

  res.status(201).json({ success: true, exam });
});

// @desc    Get all exams for the logged-in user
// @route   GET /api/exams
// @access  Private
const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ userId: req.user._id })
    .populate("subjectId", "name color")
    .sort({ examDate: 1 }); // Sort by upcoming exam date

  res.status(200).json({ success: true, count: exams.length, exams });
});

// @desc    Get a single exam by ID
// @route   GET /api/exams/:id
// @access  Private
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("subjectId", "name color");

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  res.status(200).json({ success: true, exam });
});

// @desc    Update an exam
// @route   PATCH /api/exams/:id
// @access  Private
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  res.status(200).json({ success: true, exam });
});

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  res.status(200).json({ success: true, message: "Exam deleted successfully" });
});

export { createExam, getExams, getExamById, updateExam, deleteExam };
