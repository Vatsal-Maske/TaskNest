import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import asyncHandler from "./asyncHandler.js";
import ApiError from "../utils/apiError.js";

// Protect routes - verifies JWT from cookie and attaches user to req
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, "Not authorized. Please log in.");
  }

  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Find the user by ID from token payload, exclude password
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found. Token is invalid.");
  }

  req.user = user; // Attach user to request object
  next();
});

export { protect };
