/**
 * BinGo – Recycling Guide Routes (Member 3 – Feature 3)
 */
const express = require("express");
const router  = express.Router();
const c = require("../controllers/recyclingController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/categories",    c.getCategories);
router.get("/",              c.getGuides);
router.get("/progress/me",   authenticateUser, c.getMyProgress);
router.patch("/progress/me", authenticateUser, c.updateMyProgress);
router.get("/:id",           c.getGuideById);
router.post("/",             authenticateUser, authorizeRoles("admin","waste_authority"), c.createGuide);
router.put("/:id",           authenticateUser, authorizeRoles("admin","waste_authority"), c.updateGuide);

module.exports = router;
