/**
 * BinGo – Payment Routes (DirectPay)
 *
 * POST /api/v1/payment/session   – create session (authenticated)
 * POST /api/v1/payment/callback  – DirectPay callback (public)
 */

const express = require("express");
const router  = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const { createSession, handleCallback } = require("../controllers/paymentController");

router.post("/session",  authenticateUser, createSession);
router.post("/callback", handleCallback);

module.exports = router;
