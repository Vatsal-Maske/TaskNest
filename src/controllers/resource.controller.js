import Resource from "../models/resource.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res) => {
  const { title, type, url, subjectId } = req.body;

  if (!title || !type || !url) {
    throw new ApiError(400, "Title, type, and URL are required");
  }

  const resource = await Resource.create({
    userId: req.user._id,
    subjectId,
    title,
    type,
    url,
  });

  res.status(201).json({ success: true, resource });
});

// @desc    Get all resources for the logged-in user
// @route   GET /api/resources
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const resources = await Resource.find({ userId: req.user._id })
    .populate("subjectId", "name color")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: resources.length, resources });
});

// @desc    Get a single resource by ID
// @route   GET /api/resources/:id
// @access  Private
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("subjectId", "name color");

  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  res.status(200).json({ success: true, resource });
});

// @desc    Update a resource
// @route   PATCH /api/resources/:id
// @access  Private
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  res.status(200).json({ success: true, resource });
});

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  res.status(200).json({ success: true, message: "Resource deleted successfully" });
});

export { createResource, getResources, getResourceById, updateResource, deleteResource };
