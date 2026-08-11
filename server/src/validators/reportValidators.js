/**
 * BinGo – Waste Report Validators
 * Member 2 – Illegal Dumping Reporting
 *
 * Updated to reflect extended waste type list (US-M2-03).
 */

const { body } = require("express-validator");
const { WASTE_TYPES } = require("../config/constants");

const VALID_WASTE_TYPES = Object.values(WASTE_TYPES);

const createReportValidation = [
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),

  body("wasteType")
    .trim()
    .notEmpty()
    .withMessage("Waste type is required")
    .isIn(VALID_WASTE_TYPES)
    .withMessage(`Waste type must be one of: ${VALID_WASTE_TYPES.join(", ")}`),

  body("latitude")
    .notEmpty()
    .withMessage("Latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .notEmpty()
    .withMessage("Longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("imageUrl")
    .optional({ nullable: true })
    .isString()
    .withMessage("imageUrl must be a string"),
];

const updateReportStatusValidation = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "under_review", "cleaned", "rejected"])
    .withMessage("Invalid status value"),

  body("reviewNote")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Review note cannot exceed 500 characters"),
];

module.exports = { createReportValidation, updateReportStatusValidation };
