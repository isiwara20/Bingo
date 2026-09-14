/**
 * BinGo – Authentication Validators
 *
 * Uses express-validator to validate auth request bodies.
 */

const { body } = require("express-validator");
const { ROLES } = require("../config/constants");

const ALLOWED_REGISTRATION_ROLES = [
  ROLES.RESIDENT,
  ROLES.COMMUNITY_LEADER,
  ROLES.WASTE_AUTHORITY,
];

const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("phone")
    .optional({ nullable: true })
    .trim()
    .matches(/^[\d\s\+\-\(\)]{7,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("role")
    .optional()
    .isIn(ALLOWED_REGISTRATION_ROLES)
    .withMessage(`Role must be one of: ${ALLOWED_REGISTRATION_ROLES.join(", ")}`),

  body("address")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 }).withMessage("Address cannot exceed 300 characters"),

  body("communityName")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage("Community name must be between 2 and 150 characters"),

  body("location.latitude")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),

  body("location.longitude")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

module.exports = { registerValidation, loginValidation };
