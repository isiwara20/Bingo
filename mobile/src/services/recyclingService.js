/**
 * BinGo – Recycling Service (Member 3 – Feature 3)
 */
import api from "../api/apiClient";

export const getCategories = async () => {
  const res = await api.get("/recycling/categories");
  return res.data.data;
};

export const getGuides = async (category = "") => {
  const params = category ? { category } : {};
  const res = await api.get("/recycling", { params });
  return res.data.data;
};

export const getGuideById = async (id) => {
  const res = await api.get(`/recycling/${id}`);
  return res.data.data;
};

export const getMyProgress = async () => {
  const res = await api.get("/recycling/progress/me");
  return res.data.data;
};

export const updateProgress = async (action, value) => {
  const res = await api.patch("/recycling/progress/me", { action, value });
  return res.data.data;
};
