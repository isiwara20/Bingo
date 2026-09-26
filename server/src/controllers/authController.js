/**
 * BinGo – Authentication Controller
 *
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * POST /api/v1/auth/logout      (protected)
 * GET  /api/v1/auth/me          (protected)
 * POST /api/v1/auth/send-otp
 * POST /api/v1/auth/verify-otp
 */

const authService = require("../services/authService");
const otpService = require("../services/otpService");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { HTTP_STATUS } = require("../config/constants");

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone,
    whatsappNumber, role, address,
    communityName, authorityName, location,
  } = req.body;

  const result = await authService.registerUser({
    name, email, password, phone,
    whatsappNumber, role, address,
    communityName, authorityName, location,
  });

  sendSuccess(res, HTTP_STATUS.CREATED, "Registration successful.", result);
});

/**
 * POST /api/v1/auth/login
 * Works for all roles including admin.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });
  sendSuccess(res, HTTP_STATUS.OK, "Login successful.", result);
});

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, HTTP_STATUS.OK, "Logged out successfully.");
});

/**
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, HTTP_STATUS.OK, "User profile retrieved.", req.user);
});

/**
 * POST /api/v1/auth/send-otp
 * Body: { whatsappNumber }
 * Generates a 6-digit OTP and sends it via WhatsApp (WAClient).
 */
const sendOtp = asyncHandler(async (req, res) => {
  const { whatsappNumber } = req.body;

  if (!whatsappNumber || !whatsappNumber.trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "WhatsApp number is required.",
    });
  }

  await otpService.sendOtp(whatsappNumber.trim());
  sendSuccess(res, HTTP_STATUS.OK, "OTP sent to your WhatsApp. Please check your messages.");
});

/**
 * POST /api/v1/auth/verify-otp
 * Body: { whatsappNumber, otp }
 * Verifies the OTP and marks the WhatsApp number as verified.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { whatsappNumber, otp } = req.body;

  if (!whatsappNumber || !otp) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "WhatsApp number and OTP are required.",
    });
  }

  const user = await otpService.verifyOtp(whatsappNumber.trim(), otp.trim());

  sendSuccess(res, HTTP_STATUS.OK, "WhatsApp number verified successfully.", {
    whatsappVerified: user.whatsappVerified,
  });
});

module.exports = { register, login, logout, getMe, sendOtp, verifyOtp };
