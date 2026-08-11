/**
 * BinGo – Standardised API Response Helpers
 *
 * All API responses must follow this format for consistency.
 *
 * Success:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... }
 * }
 *
 * Error:
 * {
 *   "success": false,
 *   "message": "...",
 *   "error": { ... }
 * }
 */

/**
 * Send a successful API response.
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload
 */
const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error API response.
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable error message
 * @param {*} error - Error details (omitted in production)
 */
const sendError = (res, statusCode = 500, message = "An error occurred", error = null) => {
  const response = {
    success: false,
    message,
  };

  // Only include error details in development
  if (error !== null && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated API response.
 *
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Array of items
 * @param {object} pagination - { page, limit, total, totalPages }
 */
const sendPaginated = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
