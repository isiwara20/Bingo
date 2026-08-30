/**
 * BinGo – Admin Controller
 *
 * GET  /api/v1/admin/dashboard
 * GET  /api/v1/admin/users
 * GET  /api/v1/admin/reports
 * GET  /api/v1/admin/config
 * POST /api/v1/admin/config
 */

const User     = require("../models/User");
const Config   = require("../models/Config");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../config/constants");

// ── Dashboard ────────────────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    residents,
    communityLeaders,
    wasteAuthorities,
    verifiedPhones,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "resident" }),
    User.countDocuments({ role: "community_leader" }),
    User.countDocuments({ role: "waste_authority" }),
    User.countDocuments({ phoneVerified: true }),
  ]);

  // Try to load reports if the model exists
  let totalReports = 0, pendingReports = 0, resolvedReports = 0, communities = 0;
  try {
    const Report = require("../models/Report");
    [totalReports, pendingReports, resolvedReports] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "cleaned" }),
    ]);
  } catch (_) {}

  try {
    const Community = require("../models/Community");
    communities = await Community.countDocuments();
  } catch (_) {}

  sendSuccess(res, HTTP_STATUS.OK, "Dashboard data retrieved.", {
    totalUsers,
    residents,
    communityLeaders,
    wasteAuthorities,
    verifiedPhones,
    totalReports,
    pendingReports,
    resolvedReports,
    communities,
  });
});

// ── Users ────────────────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-passwordHash -otpCode -otpExpiry")
    .sort({ createdAt: -1 });
  sendSuccess(res, HTTP_STATUS.OK, "Users retrieved.", users);
});

// ── Reports ──────────────────────────────────────────────────────────────────
const getReports = asyncHandler(async (req, res) => {
  let reports = [];
  try {
    const Report = require("../models/Report");
    reports = await Report.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
  } catch (_) {}
  sendSuccess(res, HTTP_STATUS.OK, "Reports retrieved.", reports);
});

// ── Config – GET ─────────────────────────────────────────────────────────────
const getConfig = asyncHandler(async (req, res) => {
  const config = await Config.findOne({ key: "app" }).select("+textlkApiKey");
  sendSuccess(res, HTTP_STATUS.OK, "Config retrieved.", config || {});
});

// ── Config – POST ────────────────────────────────────────────────────────────
const saveConfig = asyncHandler(async (req, res) => {
  const { textlkUserId, textlkApiKey, textlkSenderId } = req.body;

  const config = await Config.findOneAndUpdate(
    { key: "app" },
    { textlkUserId, textlkApiKey, textlkSenderId },
    { upsert: true, new: true, runValidators: true }
  );

  // Hot-reload env vars so the OTP service picks them up immediately
  if (textlkUserId)   process.env.TEXTLK_USER_ID   = textlkUserId;
  if (textlkApiKey)   process.env.TEXTLK_API_KEY   = textlkApiKey;
  if (textlkSenderId) process.env.TEXTLK_SENDER_ID = textlkSenderId;

  sendSuccess(res, HTTP_STATUS.OK, "Configuration saved.", { saved: true });
});

module.exports = { getDashboard, getUsers, getReports, getConfig, saveConfig };
