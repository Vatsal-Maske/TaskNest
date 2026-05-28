// Custom API Error class that extends the built-in Error class
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks this as a known/expected error

    // Capture the stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
