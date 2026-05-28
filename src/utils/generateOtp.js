import crypto from "crypto";

/**
 * Generates a cryptographically random 6-digit OTP string.
 * Uses crypto.randomInt for secure randomness (not Math.random).
 *
 * @returns {string} 6-digit OTP, e.g. "047382"
 */
const generateOtp = () => {
  // randomInt(0, 1000000) gives 0–999999; padStart ensures leading zeros are kept
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
};

export default generateOtp;
