/**
 * BinGo – Waste Report Validators
 *
 * Validates incoming waste report request bodies.
 */

const { body, query } = require("express-validator");
const { WASTE_TYPES } = require("../config/constants");

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
    .isIn(Object.values(WASTE_TYPES))
    .withMessage(`Waste type must be one of: ${Object.values(WASTE_TYPES).join(", ")}`),

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
