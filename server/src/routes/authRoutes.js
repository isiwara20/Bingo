/**
 * BinGo – Authentication Routes
 *
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * POST /api/v1/auth/logout      (protected)
 * GET  /api/v1/auth/me          (protected)
 * POST /api/v1/auth/send-otp
 * POST /api/v1/auth/verify-otp
 */

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../validators/authValidators");
const { handleValidationErrors } = require("../middleware/validationMiddleware");

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  authController.register
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  authController.login
);

router.post("/logout", authenticateUser, authController.logout);

router.get("/me", authenticateUser, authController.getMe);

router.post("/send-otp", authController.sendOtp);

router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
