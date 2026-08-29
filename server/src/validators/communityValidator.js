/**
 * BinGo – Community Validators
 */

const { body } = require("express-validator");
const { handleValidationErrors } = require("../middleware/validationMiddleware");

const POST_TYPES = ["post", "event", "announcement", "cleanup_activity"];

// ── Create post ───────────────────────────────────────────────────────────
const validateCreatePost = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be between 3 and 150 characters"),

  body("content")
    .trim()
    .notEmpty().withMessage("Content is required")
    .isLength({ min: 10, max: 2000 }).withMessage("Content must be between 10 and 2000 characters"),

  body("type")
    .optional()
    .isIn(POST_TYPES).withMessage(`Type must be one of: ${POST_TYPES.join(", ")}`),

  body("imageUrl")
    .optional({ nullable: true })
    .isURL().withMessage("imageUrl must be a valid URL"),

  body("eventDate")
    .optional({ nullable: true })
    .isISO8601().withMessage("eventDate must be a valid date"),

  body("location")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }).withMessage("Location cannot exceed 200 characters"),

  body("eventDate")
    .if(body("type").equals("event"))
    .notEmpty().withMessage("eventDate is required for events")
    .isISO8601().withMessage("eventDate must be a valid date"),

  body("location")
    .if(body("type").equals("event"))
    .trim()
    .notEmpty().withMessage("location is required for events"),

  handleValidationErrors,
];

// ── Update post (all fields optional) ────────────────────────────────────
const validateUpdatePost = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage("Title must be between 3 and 150 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage("Content must be between 10 and 2000 characters"),

  body("type")
    .optional()
    .isIn(POST_TYPES).withMessage(`Type must be one of: ${POST_TYPES.join(", ")}`),

  body("imageUrl")
    .optional({ nullable: true })
    .isURL().withMessage("imageUrl must be a valid URL"),

  body("eventDate")
    .optional({ nullable: true })
    .isISO8601().withMessage("eventDate must be a valid date"),

  body("location")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }).withMessage("Location cannot exceed 200 characters"),

  handleValidationErrors,
];

module.exports = { validateCreatePost, validateUpdatePost };
