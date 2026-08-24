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
  const { name, email, password, phone, role, address, communityName, location } = req.body;

  const result = await authService.registerUser({
    name,
    email,
    password,
    phone,
    role,
    address,
    communityName,
    location,
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
 * Body: { phone }
 * Generates a 6-digit OTP and sends it via text.lk SMS.
 */
const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || !phone.trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Phone number is required.",
    });
  }

  await otpService.sendOtp(phone.trim());

  sendSuccess(res, HTTP_STATUS.OK, "OTP sent successfully. Please check your phone.");
});

/**
 * POST /api/v1/auth/verify-otp
 * Body: { phone, otp }
 * Verifies the OTP and marks the phone number as verified.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Phone number and OTP are required.",
    });
  }

  const user = await otpService.verifyOtp(phone.trim(), otp.trim());

  sendSuccess(res, HTTP_STATUS.OK, "Phone number verified successfully.", {
    phoneVerified: user.phoneVerified,
  });
});

module.exports = { register, login, logout, getMe, sendOtp, verifyOtp };
