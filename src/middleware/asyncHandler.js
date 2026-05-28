/**
 * asyncHandler wraps async route handlers to automatically catch errors
 * and pass them to Express's next() error handler.
 *
 * Usage: asyncHandler(async (req, res, next) => { ... })
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
