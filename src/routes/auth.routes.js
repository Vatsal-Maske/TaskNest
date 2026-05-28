import express from "express";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register", register);          // Register → sends OTP email
router.post("/verify-otp", verifyOtp);       // Submit OTP → sets isVerified + logs in
router.post("/resend-otp", resendOtp);       // Request a fresh OTP
router.post("/login", login);                // Login (blocks unverified users)

// ── Protected Routes ──────────────────────────────────────────────────────────
router.get("/me", protect, getMe);           // Get current user profile
router.post("/logout", protect, logout);     // Logout and clear cookie

export default router;
