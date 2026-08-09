/**
 * BinGo – Waste Report Controller
 *
 * Handles:
 *   POST   /api/v1/reports              (resident – create report)
 *   GET    /api/v1/reports              (authenticated – all reports, filterable)
 *   GET    /api/v1/reports/my           (resident – own reports)
 *   GET    /api/v1/reports/:id          (authenticated – single report)
 *   PATCH  /api/v1/reports/:id/status   (waste_authority/admin – update status)
 *   DELETE /api/v1/reports/:id          (admin only)
 *
 * TODO (Member 2): Connect to reportService and image upload service.
 */

const WasteReport = require("../models/WasteReport");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, PAGINATION } = require("../config/constants");

/**
 * POST /api/v1/reports
 * Create a new waste report.
 */
const createReport = asyncHandler(async (req, res) => {
  const { description, wasteType, latitude, longitude, address, imageUrl } = req.body;

  const report = await WasteReport.create({
    reporterId: req.user._id,
    description,
    wasteType,
    location: {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    address: address || null,
    imageUrl: imageUrl || null,
  });

  sendSuccess(res, HTTP_STATUS.CREATED, "Report created successfully.", report);
});

/**
 * GET /api/v1/reports
 * Retrieve all reports with optional status filter and pagination.
 * Admin and waste_authority can see all. Residents see only their own via /my.
 */
const getAllReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
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

/**
 * GET /api/v1/reports/my
 * Retrieve the authenticated user's own reports.
 */
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await WasteReport.find({ reporterId: req.user._id })
    .sort({ createdAt: -1 });

  sendSuccess(res, HTTP_STATUS.OK, "Your reports retrieved.", reports);
});

/**
 * GET /api/v1/reports/:id
 * Retrieve a single report by ID.
 */
const getReportById = asyncHandler(async (req, res) => {
  const report = await WasteReport.findById(req.params.id)
    .populate("reporterId", "name email")
    .populate("reviewedBy", "name email");

  if (!report) {
    throw new AppError("Report not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "Report retrieved.", report);
});

/**
 * PATCH /api/v1/reports/:id/status
 * Update a report's status and optional review note.
 * Waste authority and admin only.
 */
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;

  const report = await WasteReport.findByIdAndUpdate(
    req.params.id,
    {
      status,
      reviewNote: reviewNote || null,
      reviewedBy: req.user._id,
    },
    { new: true, runValidators: true }
  );

  if (!report) {
    throw new AppError("Report not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "Report status updated.", report);
});

/**
 * DELETE /api/v1/reports/:id
 * Delete a report – admin only.
 */
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
