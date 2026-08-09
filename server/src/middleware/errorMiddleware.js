/**
 * BinGo – Global Error Handling Middleware
 *
 * Two middleware functions:
 *   1. notFound       – handles unmatched routes (404)
 *   2. globalErrorHandler – handles all errors thrown in the app
 */

const AppError = require("../utils/AppError");

/**
 * Handle requests to undefined routes.
 * Must be placed AFTER all route definitions.
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Global error handler.
 * Must be the LAST middleware registered in app.js.
 * Express identifies it as an error handler by its 4-argument signature.
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // ── Mongoose – invalid ObjectId ──────────────────────────────────────────
  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  }

  // ── Mongoose – duplicate key ──────────────────────────────────────────────
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}. Please use a different value.`;
  }

  // ── Mongoose – validation error ───────────────────────────────────────────
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((e) => e.message)
      .join(". ");
  }

  // ── JWT – invalid token ───────────────────────────────────────────────────
  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
  }

  // ── JWT – expired token ───────────────────────────────────────────────────
  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired. Please log in again.";
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === "development") {
    response.error = {
      name: error.name,
      stack: error.stack,
    };
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, globalErrorHandler };
