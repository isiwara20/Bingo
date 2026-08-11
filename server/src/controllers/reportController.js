/**
 * BinGo – Waste Report Controller
 * Member 2 – Illegal Dumping Reporting (US-M2-01 to US-M2-05)
 *
 * POST   /api/v1/reports              – resident: create report
 * GET    /api/v1/reports              – admin/authority: all reports (paginated)
 * GET    /api/v1/reports/my           – authenticated: own reports
 * GET    /api/v1/reports/:id          – authenticated: single report (ownership enforced)
 * PATCH  /api/v1/reports/:id/status   – admin/authority: update status
 * DELETE /api/v1/reports/:id          – admin only
 */

const WasteReport = require("../models/WasteReport");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, PAGINATION, REPORT_STATUSES } = require("../config/constants");

// ── POST /api/v1/reports ─────────────────────────────────────────────────
const createReport = asyncHandler(async (req, res) => {
  const { description, wasteType, latitude, longitude, address, imageUrl } = req.body;

  const report = await WasteReport.create({
    reporterId: req.user._id,
    description: description.trim(),
    wasteType,
    location: {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    address: address ? address.trim() : null,
    imageUrl: imageUrl || null,
    status: REPORT_STATUSES.PENDING,
  });

  sendSuccess(res, HTTP_STATUS.CREATED, "Report submitted successfully.", report);
});

// ── GET /api/v1/reports ──────────────────────────────────────────────────
// Admin / waste_authority only – enforced in route layer
const getAllReports = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.wasteType) filter.wasteType = req.query.wasteType;

  const [reports, total] = await Promise.all([
    WasteReport.find(filter)
      .populate("reporterId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WasteReport.countDocuments(filter),
  ]);

  sendPaginated(res, "Reports retrieved.", reports, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// ── GET /api/v1/reports/my ───────────────────────────────────────────────
// Returns only the authenticated user's own reports (US-M2-05)
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await WasteReport.find({ reporterId: req.user._id })
    .sort({ createdAt: -1 });

  sendSuccess(res, HTTP_STATUS.OK, "Your reports retrieved.", reports);
});

// ── GET /api/v1/reports/:id ──────────────────────────────────────────────
// Ownership enforced: residents can only view their own reports
const getReportById = asyncHandler(async (req, res) => {
  const report = await WasteReport.findById(req.params.id)
    .populate("reporterId", "name email")
    .populate("reviewedBy", "name email");

  if (!report) {
    throw new AppError("Report not found.", HTTP_STATUS.NOT_FOUND);
  }

  // Residents may only view reports they submitted
  const isOwner = report.reporterId._id.toString() === req.user._id.toString();
  const isPrivileged = ["admin", "waste_authority"].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    throw new AppError(
      "Access denied. You can only view your own reports.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  sendSuccess(res, HTTP_STATUS.OK, "Report retrieved.", report);
});

// ── PATCH /api/v1/reports/:id/status ────────────────────────────────────
// Waste authority / admin only – enforced in route layer
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;

  const report = await WasteReport.findByIdAndUpdate(
    req.params.id,
    {
      status,
      reviewNote: reviewNote ? reviewNote.trim() : null,
      reviewedBy: req.user._id,
    },
    { new: true, runValidators: true }
  );

  if (!report) {
    throw new AppError("Report not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "Report status updated.", report);
});

// ── DELETE /api/v1/reports/:id ───────────────────────────────────────────
// Admin only – enforced in route layer
const deleteReport = asyncHandler(async (req, res) => {
  const report = await WasteReport.findByIdAndDelete(req.params.id);

  if (!report) {
    throw new AppError("Report not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "Report deleted.");
});

module.exports = {
  createReport,
  getAllReports,
  getMyReports,
  getReportById,
  updateReportStatus,
  deleteReport,
};
