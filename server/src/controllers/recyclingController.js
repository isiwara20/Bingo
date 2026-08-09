/**
 * BinGo – Recycling Guide Controller
 *
 * TODO (Member 3 – Sprint 2):
 *   GET  /api/v1/recycling              – List all guide entries
 *   GET  /api/v1/recycling/:id          – Single guide entry
 *   POST /api/v1/recycling              – Create entry (admin/waste_authority)
 *   PUT  /api/v1/recycling/:id          – Update entry (admin/waste_authority)
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getGuides = asyncHandler(async (req, res) => {
  // TODO (Member 3): Implement with RecyclingGuide model
  sendSuccess(res, 200, "Recycling guide endpoint – coming in Sprint 2.", []);
});

const getGuideById = asyncHandler(async (req, res) => {
  // TODO (Member 3): Implement single guide retrieval
  sendSuccess(res, 200, "Get guide by ID – coming in Sprint 2.", null);
});

module.exports = { getGuides, getGuideById };
