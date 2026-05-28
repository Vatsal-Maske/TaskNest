import jwt from "jsonwebtoken";

/**
 * Generates a JWT token and stores it in an HTTP-only cookie.
 * @param {object} res - Express response object
 * @param {string} userId - The user's MongoDB _id
 */
const generateToken = (res, userId) => {
  // Sign the token with the user's ID as the payload
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Set the token in an HTTP-only cookie (not accessible via JavaScript)
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only HTTPS in production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;
};

export default generateToken;
