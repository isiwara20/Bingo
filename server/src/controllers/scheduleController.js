/**
 * BinGo – Collection Schedule Controller (Member 3)
 */

/**
 * TODO (Member 3 – Sprint 2):
 *   GET    /api/v1/schedules              – List all schedules
 *   GET    /api/v1/schedules?area=<name>  – Filter by area
 *   POST   /api/v1/schedules              – Create schedule (waste_authority/admin)
 *   PUT    /api/v1/schedules/:id          – Update schedule (waste_authority/admin)
 *   DELETE /api/v1/schedules/:id          – Delete schedule (admin)
 */

const CollectionSchedule = require("../models/CollectionSchedule");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// GET /api/v1/schedules  – all schedules, optional ?area=
const getSchedules = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.area) filter.area = { $regex: req.query.area, $options: "i" };
  const schedules = await CollectionSchedule.find(filter).sort({ collectionDay: 1 });
  sendSuccess(res, 200, "Schedules fetched.", schedules);
});

// GET /api/v1/schedules/:id
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await CollectionSchedule.findById(req.params.id);
  if (!schedule) throw new AppError("Schedule not found.", 404);
  sendSuccess(res, 200, "Schedule fetched.", schedule);
});

// POST /api/v1/schedules  – waste_authority / admin
const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await CollectionSchedule.create({
    ...req.body,
    createdBy: req.user._id,
  });
  sendSuccess(res, 201, "Schedule created.", schedule);
});

// PUT /api/v1/schedules/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await CollectionSchedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!schedule) throw new AppError("Schedule not found.", 404);
  sendSuccess(res, 200, "Schedule updated.", schedule);
});

// DELETE /api/v1/schedules/:id  – admin only
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await CollectionSchedule.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!schedule) throw new AppError("Schedule not found.", 404);
  sendSuccess(res, 200, "Schedule deactivated.", null);
});

module.exports = { getSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule };
