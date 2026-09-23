/**
 * BinGo – User Routes
 */

const express = require("express");
const router  = express.Router();
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getMe,
  updateMe,
  changePassword,
  deleteAccount,
  submitVerification,
  reviewVerification,
} = require("../controllers/userController");

router.get("/me",                         authenticateUser, getMe);
router.put("/me",                         authenticateUser, updateMe);
router.delete("/me",                      authenticateUser, deleteAccount);
router.put("/change-password",            authenticateUser, changePassword);
router.post("/verify",                    authenticateUser, authorizeRoles("resident"), submitVerification);
router.put("/:id/verification",           authenticateUser, authorizeRoles("admin"), reviewVerification);

// Admin: list pending verifications
router.get("/pending-verifications",      authenticateUser, authorizeRoles("admin"), async (req, res) => {
  const User = require("../models/User");
  const { sendSuccess } = require("../utils/apiResponse");
  const users = await User.find({
    role: "resident",
    verificationStatus: "pending",
  }).select("name email whatsappNumber address residenceImage faceImage verificationLocation createdAt");
  sendSuccess(res, 200, "Pending verifications retrieved.", users);
});

module.exports = router;
