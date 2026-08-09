/**
 * BinGo – User Controller
 *
 * Handles:
 *   GET    /api/v1/users          (admin only)
 *   GET    /api/v1/users/:id      (admin or own profile)
 *   PUT    /api/v1/users/:id      (own profile update)
 *   DELETE /api/v1/users/:id      (admin only)
 *   PATCH  /api/v1/users/:id/role (admin only)
 *
 * TODO (Member 1): Implement user management service and expand this controller.
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const { HTTP_STATUS } = require("../config/constants");

/**
 * GET /api/v1/users
 * List all users – admin only.
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-passwordHash");
  sendSuccess(res, HTTP_STATUS.OK, "Users retrieved.", users);
});

/**
 * GET /api/v1/users/:id
 * Get a single user by ID.
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "User retrieved.", user);
});

/**
 * PUT /api/v1/users/:id
 * Update own profile (name, phone, address, profileImage).
 * Does NOT allow role changes here – use PATCH /:id/role.
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, address, profileImage } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, phone, address, profileImage },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "Profile updated.", user);
});

/**
 * DELETE /api/v1/users/:id
 * Soft delete (deactivate) a user – admin only.
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, "User deactivated.");
});

/**
 * PATCH /api/v1/users/:id/role
 * Change a user's role – admin only.
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, HTTP_STATUS.OK, `User role updated to ${role}.`, user);
});

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updateUserRole };
