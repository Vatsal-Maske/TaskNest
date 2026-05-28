import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, "Exam date is required"],
    },
    syllabus: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["upcoming", "completed"],
      default: "upcoming",
    },

    // Set to true after a reminder email has been sent — prevents duplicate emails
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
