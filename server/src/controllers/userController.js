/**
 * BinGo – User Controller
 *
 * GET  /api/v1/users/me              – get current user profile
 * PUT  /api/v1/users/me              – update profile fields
 * POST /api/v1/users/verify          – submit verification (resident only)
 * GET  /api/v1/users/:id             – admin: get any user
 */

const User        = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../config/constants");

// GET /api/v1/users/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, HTTP_STATUS.OK, "Profile retrieved.", req.user);
});

// PUT /api/v1/users/me
const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "whatsappNumber", "address", "communityName", "authorityName", "profileImage"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  sendSuccess(res, HTTP_STATUS.OK, "Profile updated.", user);
});

// POST /api/v1/users/verify  (residents only)
const submitVerification = asyncHandler(async (req, res) => {
  if (req.user.role !== "resident") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Verification is only required for residents.",
    });
  }

  const { latitude, longitude, address, residenceImage, faceImage } = req.body;

  if (!latitude || !longitude) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false, message: "Location coordinates are required.",
    });
  }
  if (!residenceImage) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false, message: "Residence image is required.",
    });
  }
  if (!faceImage) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false, message: "Face image is required.",
    });
  }

  // Set to PENDING — admin must approve
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      verificationStatus: "pending",
      profileVerified: false,
      residenceImage,
      faceImage,
      verificationLocation: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || null,
      },
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address: address || req.user.address,
    },
    { new: true }
  );

  sendSuccess(res, HTTP_STATUS.OK, "Verification submitted. Awaiting admin review.", {
    verificationStatus: user.verificationStatus,
  });
});

// PUT /api/v1/users/:id/verification  (admin only)
const reviewVerification = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // action: "approve" | "reject"
  const { id } = req.params;

  if (!["approve", "reject"].includes(action)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false, message: "Action must be 'approve' or 'reject'.",
    });
  }

  const update = action === "approve"
    ? { verificationStatus: "verified", profileVerified: true, verifiedAt: new Date() }
    : { verificationStatus: "rejected", profileVerified: false, verificationRejectedReason: reason || null };

  const user = await User.findByIdAndUpdate(id, update, { new: true });
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found." });
  }

  sendSuccess(res, HTTP_STATUS.OK,
    action === "approve" ? "Verification approved." : "Verification rejected.",
    { verificationStatus: user.verificationStatus, profileVerified: user.profileVerified }
  );
// PUT /api/v1/users/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Both current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "New password must be at least 6 characters.",
    });
  }

  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "User not found.",
    });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Current password is incorrect.",
    });
  }

  user.passwordHash = newPassword;
  await user.save();

  sendSuccess(res, HTTP_STATUS.OK, "Password changed successfully.");
});

// DELETE /api/v1/users/me
const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  sendSuccess(res, HTTP_STATUS.OK, "Account deactivated successfully.");
});

module.exports = {
  getMe,
  updateMe,
  changePassword,
  deleteAccount,
  submitVerification,
  reviewVerification,
};
