/**
 * BinGo – Recycling Guide Controller (Member 3 – Feature 3)
 */
const RecyclingGuide    = require("../models/RecyclingGuide");
const RecyclingProgress = require("../models/RecyclingProgress");
const { sendSuccess }   = require("../utils/apiResponse");
const asyncHandler      = require("../utils/asyncHandler");
const AppError          = require("../utils/AppError");

// GET /api/v1/recycling?category=  – list guides
const getGuides = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.category) filter.category = { $regex: req.query.category, $options: "i" };
  const guides = await RecyclingGuide.find(filter).sort({ category: 1, title: 1 });
  sendSuccess(res, 200, "Guides fetched.", guides);
});

// GET /api/v1/recycling/categories – distinct category list
const getCategories = asyncHandler(async (req, res) => {
  const cats = await RecyclingGuide.distinct("category", { isPublished: true });
  sendSuccess(res, 200, "Categories fetched.", cats);
});

// GET /api/v1/recycling/:id
const getGuideById = asyncHandler(async (req, res) => {
  const guide = await RecyclingGuide.findById(req.params.id);
  if (!guide) throw new AppError("Guide not found.", 404);
  sendSuccess(res, 200, "Guide fetched.", guide);
});

// POST /api/v1/recycling – admin/waste_authority
const createGuide = asyncHandler(async (req, res) => {
  const guide = await RecyclingGuide.create({ ...req.body, createdBy: req.user._id });
  sendSuccess(res, 201, "Guide created.", guide);
});

// PUT /api/v1/recycling/:id
const updateGuide = asyncHandler(async (req, res) => {
  const guide = await RecyclingGuide.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!guide) throw new AppError("Guide not found.", 404);
  sendSuccess(res, 200, "Guide updated.", guide);
});

// ── Progress endpoints ────────────────────────────────────────────────────

// GET /api/v1/recycling/progress/me
const getMyProgress = asyncHandler(async (req, res) => {
  let progress = await RecyclingProgress.findOne({ userId: req.user._id });
  if (!progress) progress = await RecyclingProgress.create({ userId: req.user._id });
  sendSuccess(res, 200, "Progress fetched.", progress);
});

// PATCH /api/v1/recycling/progress/me
const updateMyProgress = asyncHandler(async (req, res) => {
  const { action, value } = req.body;
  let progress = await RecyclingProgress.findOne({ userId: req.user._id });
  if (!progress) progress = new RecyclingProgress({ userId: req.user._id });

  switch (action) {
    case "explore_category":
      if (!progress.categoriesExplored.includes(value))
        progress.categoriesExplored.push(value);
      progress.totalScore += 10;
      break;
    case "complete_story":
      if (!progress.completedStories.includes(value))
        progress.completedStories.push(value);
      progress.totalScore += 25;
      break;
    case "save_guide":
      if (!progress.savedGuides.includes(value))
        progress.savedGuides.push(value);
      break;
    case "unsave_guide":
      progress.savedGuides = progress.savedGuides.filter(id => id !== value);
      break;
    case "detective_result":
      progress.detectiveCasesPlayed += 1;
      if (value === "correct") { progress.detectiveCasesCorrect += 1; progress.totalScore += 15; }
      break;
    default:
      throw new AppError("Unknown action.", 400);
  }
  progress.lastActive = new Date();
  await progress.save();
  sendSuccess(res, 200, "Progress updated.", progress);
});

module.exports = { getGuides, getCategories, getGuideById, createGuide, updateGuide, getMyProgress, updateMyProgress };
