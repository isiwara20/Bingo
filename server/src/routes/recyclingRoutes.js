/**
 * BinGo – Recycling Guide Routes
 * TODO (Member 3 – Sprint 2): Implement full guide management.
 */

const express = require("express");
const router = express.Router();
const recyclingController = require("../controllers/recyclingController");

router.get("/", recyclingController.getGuides);
router.get("/:id", recyclingController.getGuideById);

module.exports = router;
