/**
 * BinGo – Payment Controller
 *
 * TODO (Member 1 – Sprint 2+):
 *   POST /api/v1/payments              – Initiate payment
 *   GET  /api/v1/payments              – User's payment history
 *   GET  /api/v1/payments/:id          – Single transaction
 *
 * Integration with payment gateway (e.g., Stripe) is planned for a future sprint.
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const initiatePayment = asyncHandler(async (req, res) => {
  // TODO (Member 1): Implement payment gateway integration
  sendSuccess(res, 200, "Payment endpoint – coming in a future sprint.", null);
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  // TODO (Member 1): Implement with Payment model
  sendSuccess(res, 200, "Payment history – coming in a future sprint.", []);
});

module.exports = { initiatePayment, getPaymentHistory };
