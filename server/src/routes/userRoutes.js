/**
 * BinGo – User Routes
 *
 * GET    /api/v1/users          (admin)
 * GET    /api/v1/users/:id      (admin or self)
 * PUT    /api/v1/users/:id      (self)
 * DELETE /api/v1/users/:id      (admin)
 * PATCH  /api/v1/users/:id/role (admin)
 */

const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

// All user routes require authentication
router.use(authenticateUser);

router.get("/", authorizeRoles("admin"), userController.getAllUsers);

router.get("/:id", userController.getUserById);

router.put("/:id", userController.updateUser);

router.delete("/:id", authorizeRoles("admin"), userController.deleteUser);

router.patch("/:id/role", authorizeRoles("admin"), userController.updateUserRole);

module.exports = router;
