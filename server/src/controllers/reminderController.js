/**
 * BinGo – Reminder Controller (Member 3 – Feature 2)
 *
 * GET    /api/v1/reminders?area=         – Get active reminders (resident)
 * GET    /api/v1/reminders/all           – Get all reminders (authority/admin)
 * POST   /api/v1/reminders               – Broadcast alert (authority/admin)
 * PUT    /api/v1/reminders/:id           – Update alert (authority/admin)
 * DELETE /api/v1/reminders/:id           – Deactivate alert (authority/admin)
 */

const Reminder = require("../models/Reminder");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// GET /api/v1/reminders?area= – active reminders for an area (resident view)
const getReminders = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.area) filter.area = { $regex: req.query.area, $options: "i" };
  const reminders = await Reminder.find(filter)
    .sort({ broadcastAt: -1 })
    .limit(20)
    .populate("createdBy", "name role");
  sendSuccess(res, 200, "Reminders fetched.", reminders);
});

// GET /api/v1/reminders/all – all reminders incl inactive (authority/admin)
const getAllReminders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.area) filter.area = { $regex: req.query.area, $options: "i" };
  if (req.query.type) filter.type = req.query.type;
  const reminders = await Reminder.find(filter)
    .sort({ broadcastAt: -1 })
    .populate("createdBy", "name role");
  sendSuccess(res, 200, "All reminders fetched.", reminders);
});

// GET /api/v1/reminders/:id
const getReminderById = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id).populate("createdBy", "name role");
  if (!reminder) throw new AppError("Reminder not found.", 404);
  sendSuccess(res, 200, "Reminder fetched.", reminder);
});

// POST /api/v1/reminders – authority/admin broadcast
const createReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.create({
    ...req.body,
    createdBy: req.user._id,
    broadcastAt: new Date(),
  });
  sendSuccess(res, 201, "Reminder broadcast successfully.", reminder);
});

// PUT /api/v1/reminders/:id
const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!reminder) throw new AppError("Reminder not found.", 404);
  sendSuccess(res, 200, "Reminder updated.", reminder);
});

// DELETE /api/v1/reminders/:id – hard delete for admin
const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findByIdAndDelete(req.params.id);
  if (!reminder) throw new AppError("Reminder not found.", 404);
  sendSuccess(res, 200, "Reminder deleted.", null);
});

module.exports = {
  getReminders,
  getAllReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
};
