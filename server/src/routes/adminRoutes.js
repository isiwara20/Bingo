/**
 * BinGo – Admin Routes
 *
 * GET  /api/v1/admin/dashboard   – stats summary
 * GET  /api/v1/admin/users       – list all users
 * GET  /api/v1/admin/reports     – list all reports
 * GET  /api/v1/admin/config      – get SMS / app config
 * POST /api/v1/admin/config      – save SMS / app config
 */

const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// All admin routes require a valid JWT + admin role
router.use(authenticateUser, authorizeRoles("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/users",     adminController.getUsers);
router.get("/reports",   adminController.getReports);
router.get("/config",    adminController.getConfig);
router.post("/config",   adminController.saveConfig);

module.exports = router;
