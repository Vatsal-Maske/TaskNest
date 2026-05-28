import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
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
      required: [true, "Resource title is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["link", "pdf", "video", "other"],
      required: [true, "Resource type is required"],
    },
    url: {
      type: String,
      required: [true, "Resource URL is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
