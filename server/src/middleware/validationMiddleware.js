/**
 * BinGo – Express Validator Error Handler
 *
 * Reads validation errors collected by express-validator
 * and returns a formatted 422 response if any exist.
 *
 * Usage:
 *   Place after express-validator check() chains in route definitions.
 *
 *   router.post("/register",
 *     [...validationRules],
 *     handleValidationErrors,
 *     authController.register
 *   );
 */

const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed. Please check your input.",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = { handleValidationErrors };
