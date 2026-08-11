/**
 * BinGo – Custom Application Error Class
 *
 * Extend the built-in Error class to carry HTTP status codes.
 * Use this throughout controllers and services to throw
 * meaningful errors that the global error handler can process.
 *
 * Usage:
 *   throw new AppError("User not found", 404);
 *   throw new AppError("Unauthorized access", 401);
 */

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   */
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes from unexpected errors

    // Capture the stack trace (Node.js specific)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
