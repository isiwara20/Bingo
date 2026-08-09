/**
 * BinGo – Async Handler Wrapper
 *
 * Wraps async controller functions to avoid repetitive try/catch blocks.
 * Passes any thrown errors to the Express next() error handler.
 *
 * Usage:
 *   router.get("/path", asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
