/**
 * BinGo – Collection Schedule Controller
 *
 * TODO (Member 3 – Sprint 2):
 *   GET    /api/v1/schedules              – List all schedules
 *   GET    /api/v1/schedules?area=<name>  – Filter by area
 *   POST   /api/v1/schedules              – Create schedule (waste_authority/admin)
 *   PUT    /api/v1/schedules/:id          – Update schedule (waste_authority/admin)
 *   DELETE /api/v1/schedules/:id          – Delete schedule (admin)
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getSchedules = asyncHandler(async (req, res) => {
  // TODO (Member 3): Implement with CollectionSchedule model
  sendSuccess(res, 200, "Collection schedule endpoint – coming in Sprint 2.", []);
});

const createSchedule = asyncHandler(async (req, res) => {
  // TODO (Member 3): Implement schedule creation
  sendSuccess(res, 201, "Create schedule endpoint – coming in Sprint 2.", null);
});

module.exports = { getSchedules, createSchedule };
