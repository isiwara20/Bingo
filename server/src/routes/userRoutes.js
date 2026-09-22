/**
 * BinGo – User Routes
 */

const express = require("express");
const router  = express.Router();
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");
const { getMe, updateMe, submitVerification } = require("../controllers/userController");

router.get("/me",      authenticateUser, getMe);
router.put("/me",      authenticateUser, updateMe);
router.post("/verify", authenticateUser, authorizeRoles("resident"), submitVerification);

module.exports = router;
