/**
 * Higher-order function that wraps an async Express route handler
 * to automatically catch rejected promises and forward them
 * to the next() error-handling middleware.
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function}  - Wrapped handler that catches errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
