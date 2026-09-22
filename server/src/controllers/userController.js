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
  const allowed = ["name", "phone", "address", "communityName", "authorityName", "profileImage"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  sendSuccess(res, HTTP_STATUS.OK, "Profile updated.", user);
});

// POST /api/v1/users/verify  (residents only)
// Body: { latitude, longitude, address, residenceImage (base64), faceImage (base64) }
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
      success: false,
      message: "Location coordinates are required.",
    });
  }

  if (!residenceImage) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Residence image is required.",
    });
  }

  if (!faceImage) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Face image is required.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      verificationStatus: "verified", // auto-approve for now; admin review can be added
      profileVerified: true,
      verifiedAt: new Date(),
      residenceImage,
      faceImage,
      verificationLocation: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || null,
      },
      // Also update main location
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address: address || req.user.address,
    },
    { new: true }
  );

  sendSuccess(res, HTTP_STATUS.OK, "Profile verified successfully.", {
    profileVerified: user.profileVerified,
    verificationStatus: user.verificationStatus,
    verifiedAt: user.verifiedAt,
  });
});

module.exports = { getMe, updateMe, submitVerification };
