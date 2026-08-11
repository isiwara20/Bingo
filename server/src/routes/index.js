/**
 * BinGo – API Route Index
 *
 * Mounts all versioned API routes.
 * All routes are prefixed with /api/v1 in app.js.
 */

const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const reportRoutes = require("./reportRoutes");
const mapRoutes = require("./mapRoutes");
const scheduleRoutes = require("./scheduleRoutes");
const recyclingRoutes = require("./recyclingRoutes");
const communityRoutes = require("./communityRoutes");
const notificationRoutes = require("./notificationRoutes");
const rewardRoutes = require("./rewardRoutes");
const paymentRoutes = require("./paymentRoutes");

// ── Health Check ───────────────────────────────────────────────────────────
const mongoose = require("mongoose");

router.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    success: true,
    message: "BinGo API is running",
    data: {
      server: "online",
      database: dbStatus,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Feature Routes ─────────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/map", mapRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/recycling", recyclingRoutes);
router.use("/community", communityRoutes);
router.use("/notifications", notificationRoutes);
router.use("/rewards", rewardRoutes);
router.use("/payments", paymentRoutes);

module.exports = router;
