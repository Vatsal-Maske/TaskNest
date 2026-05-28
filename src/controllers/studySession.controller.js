import StudySession from "../models/studySession.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// @desc    Create a new study session
// @route   POST /api/study-sessions
// @access  Private
const createStudySession = asyncHandler(async (req, res) => {
  const { subjectId, duration, startedAt, endedAt } = req.body;

  if (!subjectId || !duration || !startedAt || !endedAt) {
    throw new ApiError(400, "Subject, duration, startedAt, and endedAt are required");
  }

  const session = await StudySession.create({
    userId: req.user._id,
    subjectId,
    duration,
    startedAt,
    endedAt,
  });

  res.status(201).json({ success: true, session });
});

// @desc    Get all study sessions for the logged-in user
// @route   GET /api/study-sessions
// @access  Private
const getStudySessions = asyncHandler(async (req, res) => {
  const sessions = await StudySession.find({ userId: req.user._id })
    .populate("subjectId", "name color")
    .sort({ startedAt: -1 });

  res.status(200).json({ success: true, count: sessions.length, sessions });
});

// @desc    Get study stats for the logged-in user
// @route   GET /api/study-sessions/stats
// @access  Private
const getStudyStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all sessions for aggregation
  const sessions = await StudySession.find({ userId }).populate(
    "subjectId",
    "name color"
  );

  // Total minutes studied
  const totalStudyTime = sessions.reduce((sum, s) => sum + s.duration, 0);

  // Total number of sessions
  const totalSessions = sessions.length;

  // Build subject-wise study time map
  const subjectMap = {};
  sessions.forEach((session) => {
    if (!session.subjectId) return;

    const subjectId = session.subjectId._id.toString();
    if (!subjectMap[subjectId]) {
      subjectMap[subjectId] = {
        subjectId,
        name: session.subjectId.name,
        color: session.subjectId.color,
        totalMinutes: 0,
      };
    }
    subjectMap[subjectId].totalMinutes += session.duration;
  });

  const subjectWiseStudyTime = Object.values(subjectMap);

  res.status(200).json({
    success: true,
    stats: {
      totalStudyTime,      // in minutes
      totalSessions,
      subjectWiseStudyTime,
    },
  });
});

// @desc    Delete a study session
// @route   DELETE /api/study-sessions/:id
// @access  Private
const deleteStudySession = asyncHandler(async (req, res) => {
  const session = await StudySession.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!session) {
    throw new ApiError(404, "Study session not found");
  }

  res.status(200).json({ success: true, message: "Study session deleted successfully" });
});

export { createStudySession, getStudySessions, getStudyStats, deleteStudySession };
