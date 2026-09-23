const service = require("../services/goalService");
const constants = require("../config/goalConstants");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const handler = (message, action, status = 200) => asyncHandler(async (req, res) => sendSuccess(res, status, message, await action(req)));
module.exports = {
  options: handler("Goal options retrieved.", () => ({ categories: constants.CATEGORIES, units: constants.UNITS, periods: constants.PERIODS, icons: constants.ICONS, suggestions: constants.SUGGESTIONS })),
  list: handler("Your goals retrieved.", req => service.listGoals(req.user._id, req.query)),
  summary: handler("Your sustainability progress retrieved.", req => service.getSummary(req.user._id)),
  create: handler("Goal created successfully!", req => service.createGoal(req.user._id, req.body), 201),
  details: handler("Goal retrieved.", req => service.getGoal(req.user._id, req.params.id)),
  history: handler("Progress history retrieved.", req => service.history(req.user._id, req.params.id, req.query)),
  edit: handler("Goal updated successfully.", req => service.editGoal(req.user._id, req.params.id, req.body)),
  progress: handler("Progress saved successfully.", req => service.addProgress(req.user._id, req.params.id, req.body)),
  cancel: handler("Goal cancelled.", req => service.cancelGoal(req.user._id, req.params.id)),
  remove: handler("Goal deleted.", req => service.deleteGoal(req.user._id, req.params.id)),
};
