const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const service = require("../services/passwordResetService");
const asyncHandler = require("../utils/asyncHandler");
const { handleValidationErrors } = require("../middleware/validationMiddleware");
const { sendSuccess } = require("../utils/apiResponse");
const router = express.Router();

router.use(rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many reset attempts. Please try again in 15 minutes." },
}));
const emailRule = () => body("email").isString().bail().trim().isEmail().normalizeEmail();
router.post("/request", [emailRule()], handleValidationErrors, asyncHandler(async (req, res) => {
  await service.requestReset(req.body.email);
  sendSuccess(res, 200, "If an active account matches this email, a code has been sent to its registered WhatsApp number.");
}));
router.post("/verify", [emailRule(), body("otp").isString().bail().matches(/^\d{6}$/)], handleValidationErrors, asyncHandler(async (req, res) => {
  const data = await service.verifyReset(req.body.email, req.body.otp);
  sendSuccess(res, 200, "Code verified.", data);
}));
router.post("/complete", [
  body("resetToken").isString().bail().matches(/^[a-f0-9]{64}$/),
  body("password").isString().bail().isLength({ min: 8, max: 72 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .custom(value => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Use 8–72 characters with uppercase, lowercase and a number (maximum 72 bytes)."),
], handleValidationErrors, asyncHandler(async (req, res) => {
  await service.resetPassword(req.body.resetToken, req.body.password);
  sendSuccess(res, 200, "Password reset successfully. Sign in with your new password.");
}));
module.exports = router;
