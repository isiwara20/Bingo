/**
 * BinGo – Map Controller
 * Member 2 – Interactive Waste Map (US-M2-06, US-M2-07)
 *
 * GET /api/v1/map/reports    – dumping markers (authenticated)
 * GET /api/v1/map/locations  – recycling centres + collection points (public)
 * GET /api/v1/map/nearby     – locations within radius (public)
 */

const WasteReport = require("../models/WasteReport");
const WasteLocation = require("../models/WasteLocation");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, REPORT_STATUSES } = require("../config/constants");

/**
 * GET /api/v1/map/reports
 *
 * Returns pending and under-review dumping reports for map display.
 * Only exposes fields needed by the map — not full report details.
 * Authenticated route (reporters can see all active markers, not just their own).
 */
const getReportLocations = asyncHandler(async (req, res) => {
  const reports = await WasteReport.find({
    status: { $in: [REPORT_STATUSES.PENDING, REPORT_STATUSES.UNDER_REVIEW] },
  }).select("location wasteType status address description createdAt");

  sendSuccess(res, HTTP_STATUS.OK, "Report locations retrieved.", reports);
});

/**
 * GET /api/v1/map/locations
 *
 * Returns active waste facility locations.
 * Optional query: ?type=recycling_centre|collection_point|bin
 * Public endpoint – no auth required.
 */
const getWasteLocations = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;

  const locations = await WasteLocation.find(filter).select(
    "name type address description location operatingHours acceptedWasteTypes"
  );

  sendSuccess(res, HTTP_STATUS.OK, "Waste locations retrieved.", locations);
});

/**
 * GET /api/v1/map/nearby?lat=&lng=&radius=
 *
 * Returns WasteLocation documents within radius km of given coordinates.
 * Uses MongoDB $near geospatial operator.
 * Public endpoint.
 */
const getNearbyLocations = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    throw new AppError(
      "lat and lng query parameters are required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusMetres = parseFloat(radius) * 1000;

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMetres)) {
    throw new AppError(
      "lat, lng, and radius must be valid numbers.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const locations = await WasteLocation.find({
    isActive: true,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: radiusMetres,
      },
    },
  });

  sendSuccess(res, HTTP_STATUS.OK, "Nearby locations retrieved.", locations);
});

module.exports = { getReportLocations, getWasteLocations, getNearbyLocations };
