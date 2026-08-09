/**
 * BinGo – Map Controller
 *
 * Handles:
 *   GET /api/v1/map/reports         – Waste report locations for map display
 *   GET /api/v1/map/locations        – Recycling centres and collection points
 *   GET /api/v1/map/nearby           – Locations within radius (lat, lng, radius)
 *
 * TODO (Member 2): Connect map data to real geospatial queries.
 */

const WasteReport = require("../models/WasteReport");
const WasteLocation = require("../models/WasteLocation");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, REPORT_STATUSES } = require("../config/constants");

/**
 * GET /api/v1/map/reports
 * Returns all non-cleaned report locations for map markers.
 */
const getReportLocations = asyncHandler(async (req, res) => {
  const reports = await WasteReport.find({
    status: { $in: [REPORT_STATUSES.PENDING, REPORT_STATUSES.UNDER_REVIEW] },
  }).select("location wasteType status address createdAt");

  sendSuccess(res, HTTP_STATUS.OK, "Report locations retrieved.", reports);
});

/**
 * GET /api/v1/map/locations
 * Returns recycling centres and collection points.
 */
const getWasteLocations = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;

  const locations = await WasteLocation.find(filter);

  sendSuccess(res, HTTP_STATUS.OK, "Waste locations retrieved.", locations);
});

/**
 * GET /api/v1/map/nearby
 * Returns locations within a given radius (km) of a coordinate.
 *
 * Query params: lat, lng, radius (km, default 5)
 */
const getNearbyLocations = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    throw new AppError("lat and lng query parameters are required.", HTTP_STATUS.BAD_REQUEST);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusInMetres = parseFloat(radius) * 1000;

  const locations = await WasteLocation.find({
    isActive: true,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: radiusInMetres,
      },
    },
  });

  sendSuccess(res, HTTP_STATUS.OK, "Nearby locations retrieved.", locations);
});

module.exports = { getReportLocations, getWasteLocations, getNearbyLocations };
