/**
 * BinGo – Authentication Controller
 *
 * Handles:
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/auth/me
 *
 * Business logic is delegated to authService.
 * This controller only handles HTTP concerns.
 */

const authService = require("../services/authService");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { HTTP_STATUS } = require("../config/constants");

/**
 * POST /api/v1/auth/register
 * Register a new resident user.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const result = await authService.registerUser({ name, email, password, phone });

  sendSuccess(res, HTTP_STATUS.CREATED, "Registration successful.", result);
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser({ email, password });

  sendSuccess(res, HTTP_STATUS.OK, "Login successful.", result);
});

/**
 * POST /api/v1/auth/logout
 * Stateless JWT logout – client discards the token.
 * Protected route (requires authenticateUser middleware).
 */
const logout = asyncHandler(async (req, res) => {
  // JWT is stateless. The client must discard the token.
  // For token invalidation (blacklisting), a Redis store would be needed.
  // TODO Sprint 2+: Implement token blacklisting with Redis if required.
  sendSuccess(res, HTTP_STATUS.OK, "Logged out successfully.");
});

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user's profile.
 * Protected route (requires authenticateUser middleware).
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by authenticateUser middleware
  sendSuccess(res, HTTP_STATUS.OK, "User profile retrieved.", req.user);
});

module.exports = { register, login, logout, getMe };
