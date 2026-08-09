/**
 * BinGo – Payment Routes
 * TODO (Member 1 – Sprint 2+): Implement payment gateway integration.
 */

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateUser } = require("../middleware/authMiddleware");

router.use(authenticateUser);

router.post("/", paymentController.initiatePayment);
router.get("/", paymentController.getPaymentHistory);

module.exports = router;
