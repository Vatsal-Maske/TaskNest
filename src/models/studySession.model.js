import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required for a study session"],
    },
    duration: {
      type: Number, // Duration in minutes
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    startedAt: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endedAt: {
      type: Date,
      required: [true, "End time is required"],
    },
  },
  {
    timestamps: true,
  }
);

const StudySession = mongoose.model("StudySession", studySessionSchema);

export default StudySession;
