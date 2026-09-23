const { body, param, query } = require("express-validator");
const { CATEGORIES, UNITS, PERIODS, ICONS } = require("../config/goalConstants");
const isDateOnly = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const isAmount = value => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1000000 && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
const fields = (partial = false) => {
  const rule = name => partial ? body(name).optional() : body(name);
  return [
    rule("title").isString().bail().trim().isLength({ min: 1, max: 100 }).withMessage("Enter a goal name (up to 100 characters)."),
    body("description").optional().isString().bail().trim().isLength({ max: 1000 }).withMessage("Keep the description within 1,000 characters."),
    rule("category").isIn(CATEGORIES).withMessage("Choose a goal category."),
    rule("targetAmount").custom(isAmount).withMessage("Enter a target greater than zero, up to 1,000,000, with at most two decimal places."),
    rule("unit").isIn(UNITS).withMessage("Choose a unit."),
    rule("targetDate").custom(isDateOnly).withMessage("Choose a valid target date."),
    body("icon").optional().isIn(ICONS).withMessage("Choose one of the available icons."),
  ];
};
const create = [...fields(), body("startDate").custom(isDateOnly).withMessage("Choose a valid start date."), body("period").isIn(PERIODS).withMessage("Choose a goal period.")];
const edit = [...fields(true), body().custom(value => Object.keys(value).every(k => ["title", "description", "category", "targetAmount", "unit", "targetDate", "icon"].includes(k))).withMessage("Only the goal’s editable fields can be changed.")];
const id = [param("id").isMongoId().withMessage("This goal link is invalid.")];
const pagination = [query("page").optional().isInt({ min: 1, max: 100000 }), query("limit").optional().isInt({ min: 1, max: 50 })];
const list = [...pagination, query("status").optional().isIn(["active", "completed", "cancelled"])];
const progress = [...id, body("amountAdded").custom(isAmount).withMessage("Enter a positive amount with at most two decimal places."), body("note").optional().isString().bail().trim().isLength({ max: 500 }).withMessage("Keep your note within 500 characters."), body("requestId").isString().bail().matches(/^[A-Za-z0-9_-]{8,100}$/).withMessage("A valid progress request ID is required.")];
module.exports = { create, edit, id, pagination, list, progress };
