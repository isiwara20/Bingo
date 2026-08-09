/**
 * BinGo – Application Constants
 *
 * Centralise magic strings and shared constants here.
 * Import from this file rather than repeating literals.
 */

// ── User Roles ─────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  RESIDENT: "resident",
  COMMUNITY_LEADER: "community_leader",
  WASTE_AUTHORITY: "waste_authority",
  ADMIN: "admin",
});

// ── Waste Types ────────────────────────────────────────────────────────────
const WASTE_TYPES = Object.freeze({
  PLASTIC: "plastic",
  GLASS: "glass",
  PAPER: "paper",
  METAL: "metal",
  ELECTRONIC: "electronic",
  ORGANIC: "organic",
  MIXED: "mixed",
  OTHER: "other",
});

// ── Report Statuses ────────────────────────────────────────────────────────
const REPORT_STATUSES = Object.freeze({
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  CLEANED: "cleaned",
  REJECTED: "rejected",
});

// ── HTTP Status Codes ──────────────────────────────────────────────────────
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
});

// ── Pagination Defaults ────────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

module.exports = {
  ROLES,
  WASTE_TYPES,
  REPORT_STATUSES,
  HTTP_STATUS,
  PAGINATION,
};
