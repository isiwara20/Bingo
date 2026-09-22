/**
 * BinGo – Plan Controller
 *
 * GET  /api/v1/plans               – list all active plans (public)
 * POST /api/v1/plans/select        – resident selects/changes plan (auth)
 * PUT  /api/v1/plans/:key          – admin updates plan price/benefits
 */

const Plan = require("../models/Plan");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../config/constants");

// ── GET /api/v1/plans ─────────────────────────────────────────────────────
const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
  sendSuccess(res, HTTP_STATUS.OK, "Plans retrieved.", plans);
});

// ── POST /api/v1/plans/select ─────────────────────────────────────────────
// Body: { planKey, paymentRef? }
const selectPlan = asyncHandler(async (req, res) => {
  const { planKey, paymentRef } = req.body;
  const userId = req.user._id;

  const plan = await Plan.findOne({ key: planKey, isActive: true });
  if (!plan) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Plan not found.",
    });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      plan: planKey,
      hasSelectedPlan: true,
      planActivatedAt: new Date(),
    },
    { new: true }
  );

  sendSuccess(res, HTTP_STATUS.OK, `Plan "${plan.name}" selected successfully.`, {
    plan: user.plan,
    hasSelectedPlan: user.hasSelectedPlan,
    planActivatedAt: user.planActivatedAt,
  });
});

// ── PUT /api/v1/plans/:key (admin only) ───────────────────────────────────
const updatePlan = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { name, tagline, price, benefits, color, badge, isActive, billingPeriod } = req.body;

  const plan = await Plan.findOneAndUpdate(
    { key },
    { name, tagline, price, benefits, color, badge, isActive, billingPeriod },
    { new: true, runValidators: true }
  );

  if (!plan) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Plan not found.",
    });
  }

  sendSuccess(res, HTTP_STATUS.OK, "Plan updated.", plan);
});

module.exports = { getPlans, selectPlan, updatePlan };
