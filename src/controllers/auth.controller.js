import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import generateOtp from "../utils/generateOtp.js";
import ApiError from "../utils/apiError.js";
import sendEmail from "../services/email.service.js";

// @desc    Register a new user and send OTP for email verification
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Generate a plain 6-digit OTP (e.g. "047382")
  const otp = generateOtp();

  // Hash the OTP before storing — never save plain OTPs in the database
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  // OTP expires 10 minutes from now
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Create user — isVerified defaults to false, password is hashed in pre-save hook
  const user = await User.create({
    name,
    email,
    password,
    otp: hashedOtp,
    otpExpires,
  });


  // If email is not configured (dev/test with no OAuth2 creds), skip sending
  // and auto-verify the user so the rest of the system stays testable.
  if (!process.env.EMAIL_USER) {
    user.isVerified = true;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful. (Email not configured — auto-verified for development.)",
      email: user.email,
      devNote: "Set EMAIL_USER and OAuth2 credentials in .env to enable real OTP emails.",
    });
    return;
  }

  // Send OTP to user's email (we do NOT return the OTP in the response)
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #6366f1;">📚 StudyOS — Verify Your Email</h2>
      <p>Hi <strong>${name}</strong>, welcome to StudyOS!</p>
      <p>Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px;">If you didn't register on StudyOS, ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail(
      email,
      "StudyOS — Verify Your Email",
      `Your StudyOS OTP is: ${otp}. It expires in 10 minutes.`,
      html
    );
  } catch (emailErr) {
    // If email fails, delete the user so they can try again
    await User.findByIdAndDelete(user._id);
    throw new ApiError(500, "Failed to send OTP email. Please try again.");
  }

  res.status(201).json({
    success: true,
    message: "Registration successful. An OTP has been sent to your email.",
    email: user.email, // Return email so the frontend knows where to send /verify-otp
  });
});

// @desc    Verify email using OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  // Fetch user with the OTP fields (select: false by default so we need to include them)
  const user = await User.findOne({ email }).select("+otp +otpExpires +password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.otp || !user.otpExpires) {
    throw new ApiError(400, "No OTP found. Please register or request a new OTP.");
  }

  // Check if the OTP has expired
  if (user.otpExpires < new Date()) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // Compare the entered plain OTP against the stored hashed OTP
  const isOtpCorrect = await bcrypt.compare(otp, user.otp);
  if (!isOtpCorrect) {
    throw new ApiError(400, "Invalid OTP. Please try again.");
  }

  // Mark user as verified and clear the OTP fields
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Generate JWT and log the user in immediately after verification
  generateToken(res, user._id);

  res.status(200).json({
    success: true,
    message: "Email verified successfully. You are now logged in.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
});

// @desc    Resend OTP to the user's email
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "This email is already verified.");
  }

  // Generate and hash a new OTP
  const otp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = hashedOtp;
  user.otpExpires = otpExpires;
  await user.save();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #6366f1;">📚 StudyOS — Your New OTP</h2>
      <p>Hi <strong>${user.name}</strong>!</p>
      <p>Here is your new OTP. It expires in <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${otp}</span>
      </div>
    </div>
  `;

  await sendEmail(
    email,
    "StudyOS — Your New OTP",
    `Your new OTP is: ${otp}. It expires in 10 minutes.`,
    html
  );

  res.status(200).json({
    success: true,
    message: "A new OTP has been sent to your email.",
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Fetch password (select: false) and isVerified fields
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Block login if user hasn't verified their email
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email first. Check your inbox for the OTP.");
  }

  // Compare entered password with hashed password in DB
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate JWT and set cookie
  generateToken(res, user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
});

// @desc    Get currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is already set by the auth middleware
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Clear the cookie by setting it to an empty string with immediate expiry
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export { register, verifyOtp, resendOtp, login, getMe, logout };
