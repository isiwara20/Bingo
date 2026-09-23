export const dateOnly = value => value?.slice(0, 10) || "";
export const today = () => {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export const formatDate = value => value ? new Date(`${dateOnly(value)}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
export const formatAmount = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
export const percentage = goal => Math.min(100, Math.max(0, Math.floor(Number(goal.currentProgress) / Number(goal.targetAmount) * 100) || 0));
export const endForPeriod = (start, period) => {
  if (!validDate(start)) return "";
  const d = new Date(`${start}T12:00:00Z`);
  if (period === "Weekly") d.setUTCDate(d.getUTCDate() + 6);
  else if (period === "Monthly") { const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1); const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(day - 1, lastDay)); }
  return d.toISOString().slice(0, 10);
};
export const newRequestId = () => `goal_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
export const validateGoal = values => {
  const errors = {};
  if (!values.title.trim()) errors.title = "Give your goal a name.";
  if (!values.category) errors.category = "Choose a category.";
  const target = Number(values.targetAmount);
  if (!Number.isFinite(target) || target <= 0 || target > 1000000 || Math.abs(target * 100 - Math.round(target * 100)) > 0.000001) errors.targetAmount = "Use a number greater than zero, up to 1,000,000 (max. 2 decimals).";
  if (!values.unit) errors.unit = "Choose a unit.";
  if (!values.period) errors.period = "Choose a goal period.";
  if (!validDate(values.startDate)) errors.startDate = "Choose a valid start date.";
  if (!validDate(values.targetDate)) errors.targetDate = "Choose a valid target date.";
  else if (values.targetDate < values.startDate) errors.targetDate = "Target date cannot be before start date.";
  if (!values.icon) errors.icon = "Choose an icon.";
  return errors;
};
