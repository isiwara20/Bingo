/**
 * BinGo – Plan Service (Mobile)
 */

import api from "../api/apiClient";

/** Fetch all active plans */
export const getPlans = async () => {
  const res = await api.get("/plans");
  return res.data.data;
};

/** Select a plan for the logged-in resident */
export const selectPlan = async (planKey, paymentRef = null) => {
  const res = await api.post("/plans/select", { planKey, paymentRef });
  return res.data.data;
};

/** Admin: update a plan's details */
export const updatePlan = async (key, data) => {
  const res = await api.put(`/plans/${key}`, data);
  return res.data.data;
};
