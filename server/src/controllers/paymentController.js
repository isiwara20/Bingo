/**
 * BinGo – Payment Controller (DirectPay)
 *
 * POST /api/v1/payment/session   – create a DirectPay payment session
 * POST /api/v1/payment/callback  – handle DirectPay response_url callback
 *
 * DirectPay integration:
 *   - Payload is base64-encoded JSON
 *   - Signature is HmacSHA256 of the base64 payload, using the secret key
 *   - Stage: PROD for live, DEV for sandbox
 */

const crypto      = require("crypto");
const User        = require("../models/User");
const Plan        = require("../models/Plan");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../config/constants");

const MERCHANT_ID  = process.env.DIRECTPAY_MERCHANT_ID;
const SECRET_KEY   = process.env.DIRECTPAY_SECRET_KEY;
const STAGE        = process.env.DIRECTPAY_STAGE || "PROD";

// HmacSHA256 signature
const makeSignature = (base64Payload) =>
  crypto.createHmac("sha256", SECRET_KEY)
    .update(base64Payload)
    .digest("hex");

// ── POST /api/v1/payment/session ─────────────────────────────────────────────
const createSession = asyncHandler(async (req, res) => {
  const { planKey } = req.body;
  const user = req.user;

  if (!planKey || !["plus", "pro"].includes(planKey)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid plan. Only plus and pro require payment.",
    });
  }

  const plan = await Plan.findOne({ key: planKey, isActive: true });
  if (!plan) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Plan not found.",
    });
  }

  if (!MERCHANT_ID || !SECRET_KEY) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Payment gateway not configured. Contact admin.",
    });
  }

  const orderId = `BINGO-${user._id}-${Date.now()}`;

  // Split name into first/last
  const nameParts = (user.name || "BinGo User").trim().split(" ");
  const firstName = nameParts[0] || "BinGo";
  const lastName  = nameParts.slice(1).join(" ") || "User";

  const payloadObj = {
    merchant_id:  MERCHANT_ID,
    amount:       plan.price.toFixed(2),
    type:         "ONE_TIME",
    order_id:     orderId,
    currency:     plan.currency || "LKR",
    response_url: `${process.env.SERVER_URL || "http://localhost:5000"}/api/v1/payment/callback`,
    first_name:   firstName,
    last_name:    lastName,
    email:        user.email || "",
    phone:        user.whatsappNumber || user.phone || "",
    logo:         "",
  };

  const payloadJson   = JSON.stringify(payloadObj);
  const base64Payload = Buffer.from(payloadJson).toString("base64");
  const signature     = makeSignature(base64Payload);

  sendSuccess(res, HTTP_STATUS.OK, "Payment session created.", {
    dataString: base64Payload,
    signature,
    stage: STAGE,
    orderId,
    planKey,
    amount: plan.price,
    currency: plan.currency || "LKR",
    planName: plan.name,
  });
});

// ── POST /api/v1/payment/callback ────────────────────────────────────────────
// DirectPay posts result to this URL
const handleCallback = asyncHandler(async (req, res) => {
  const { order_id, status_code, payment_id, message } = req.body;

  console.log("[DirectPay Callback]", { order_id, status_code, payment_id, message });

  // order_id format: BINGO-{userId}-{timestamp}
  if (order_id && status_code === "00") {
    const parts  = order_id.split("-");
    const userId = parts[1];
    const planKey = req.body.plan_key || null; // may not come from DirectPay

    if (userId) {
      // Mark payment successful — plan is activated via the /plans/select endpoint
      // called from the mobile app after receiving success in the SDK callback
      console.log(`[Payment] Success for user ${userId}, order ${order_id}`);
    }
  }

  // DirectPay expects 200 OK
  res.status(200).json({ success: true });
});

module.exports = { createSession, handleCallback };
