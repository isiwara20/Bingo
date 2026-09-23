const mongoose = require("mongoose");
const Goal = require("../models/SustainabilityGoal");
const Entry = require("../models/GoalProgressEntry");
const AppError = require("../utils/AppError");
const { UNITS } = require("../config/goalConstants");
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const percent = (value, total) => total ? Math.min(100, Math.round(value / total * 100)) : 0;
const ownGoal = async (userId, id, session = null) => {
  const goal = await Goal.findOne({ _id: id, userId }).session(session);
  if (!goal) throw new AppError("Goal not found. It may have been deleted.", 404);
  return goal;
};
const pageOptions = query => ({ page: Number(query.page || 1), limit: Number(query.limit || 20) });

const createGoal = async (userId, input) => {
  const { title, description, category, targetAmount, unit, period, startDate, targetDate, icon } = input;
  if (targetDate < startDate) throw new AppError("Target date cannot be before start date.", 422);
  return Goal.create({ userId, title, description, category, targetAmount, unit, period, startDate, targetDate, icon });
};
const listGoals = async (userId, query) => {
  const { page, limit } = pageOptions(query);
  const status = query.status || "active";
  const filter = { userId, status };
  const [goals, total] = await Promise.all([
    Goal.find(filter).sort(status === "completed" ? { completedAt: -1, _id: -1 } : { createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Goal.countDocuments(filter),
  ]);
  return { goals, status, page, totalPages: Math.ceil(total / limit), total };
};
const history = async (userId, id, query) => {
  await ownGoal(userId, id);
  const { page, limit } = pageOptions(query);
  const filter = { goalId: id, userId };
  const [entries, total] = await Promise.all([
    Entry.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), Entry.countDocuments(filter),
  ]);
  return { entries, page, totalPages: Math.ceil(total / limit), total };
};
const editGoal = (userId, id, changes) => mongoose.connection.transaction(async session => {
  const goal = await ownGoal(userId, id, session);
  Object.assign(goal, changes);
  if (goal.targetDate < goal.startDate) throw new AppError("Target date cannot be before start date.", 422);
  if (changes.targetDate) goal.period = "Custom";
  if (goal.status !== "cancelled") {
    const completed = goal.currentProgress >= goal.targetAmount;
    goal.status = completed ? "completed" : "active";
    goal.completedAt = completed ? (goal.completedAt || new Date()) : null;
  }
  await goal.save({ session });
  return goal;
});
const addProgress = (userId, id, input) => mongoose.connection.transaction(async session => {
  const goal = await ownGoal(userId, id, session);
  const previous = await Entry.findOne({ userId, goalId: id, requestId: input.requestId }).session(session);
  if (previous) {
    if (previous.requestedAmount !== input.amountAdded || previous.note !== (input.note || "")) throw new AppError("This update was already submitted with different values. Please reopen Update Progress.", 409);
    return { goal, entry: previous, replayed: true };
  }
  if (goal.status !== "active") throw new AppError("Only active goals can receive progress updates.", 409);
  const amountAdded = round(Math.min(input.amountAdded, goal.targetAmount - goal.currentProgress));
  goal.currentProgress = round(goal.currentProgress + amountAdded);
  if (goal.currentProgress >= goal.targetAmount) { goal.status = "completed"; goal.completedAt = new Date(); }
  await goal.save({ session });
  const [entry] = await Entry.create([{
    userId, goalId: id, requestId: input.requestId, requestedAmount: input.amountAdded,
    amountAdded, note: input.note || "", progressAfterUpdate: goal.currentProgress,
    targetAtUpdate: goal.targetAmount, unit: goal.unit,
  }], { session });
  return { goal, entry, replayed: false };
});
const cancelGoal = (userId, id) => mongoose.connection.transaction(async session => {
  const goal = await ownGoal(userId, id, session);
  if (goal.status === "completed") throw new AppError("Completed goals cannot be cancelled. You can delete the goal instead.", 409);
  goal.status = "cancelled";
  await goal.save({ session });
  return goal;
});
const deleteGoal = (userId, id) => mongoose.connection.transaction(async session => {
  await ownGoal(userId, id, session);
  await Entry.deleteMany({ goalId: id, userId }, { session });
  await Goal.deleteOne({ _id: id, userId }, { session });
});
const getSummary = async userId => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [goals, totals] = await Promise.all([
    Goal.find({ userId }).select("status currentProgress targetAmount completedAt startDate").lean(),
    Entry.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(String(userId)), createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$unit", amount: { $sum: "$amountAdded" }, updates: { $sum: 1 } } },
    ]),
  ]);
  const active = goals.filter(g => g.status === "active");
  const completed = goals.filter(g => g.status === "completed");
  const eligible = [...active, ...completed];
  const monthlyCompleted = completed.filter(g => g.completedAt >= start && g.completedAt < end).length;
  const monthlyActive = active.filter(g => g.startDate < end).length;
  const amountsByUnit = Object.fromEntries(UNITS.map(unit => [unit, round(totals.find(t => t._id === unit)?.amount || 0)]));
  return {
    activeGoals: active.length, completedGoals: completed.length,
    cancelledGoals: goals.filter(g => g.status === "cancelled").length,
    overallProgress: eligible.length ? Math.round(eligible.reduce((sum, g) => sum + Math.min(1, g.currentProgress / g.targetAmount), 0) / eligible.length * 100) : 0,
    completionRate: percent(completed.length, eligible.length),
    month: { label: start.toISOString().slice(0, 7), completedGoals: monthlyCompleted, activeGoals: monthlyActive,
      completionRate: percent(monthlyCompleted, monthlyCompleted + monthlyActive),
      totalEcoActions: amountsByUnit.Actions, amountsByUnit, updatesLogged: totals.reduce((sum, t) => sum + t.updates, 0) },
  };
};
module.exports = { createGoal, listGoals, getGoal: ownGoal, history, editGoal, addProgress, cancelGoal, deleteGoal, getSummary };
