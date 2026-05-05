/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's error handler via `next(err)`.  Required in Express 4, which does
 * not catch async errors automatically (fixed in Express 5).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
