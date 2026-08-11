/**
 * BinGo – Map Routes
 *
 * GET /api/v1/map/reports     – Report locations (authenticated)
 * GET /api/v1/map/locations   – Waste locations (public)
 * GET /api/v1/map/nearby      – Nearby locations (public)
 */

const express = require("express");
const router = express.Router();

const mapController = require("../controllers/mapController");
const { authenticateUser } = require("../middleware/authMiddleware");

router.get("/reports", authenticateUser, mapController.getReportLocations);

router.get("/locations", mapController.getWasteLocations);

router.get("/nearby", mapController.getNearbyLocations);

module.exports = router;
