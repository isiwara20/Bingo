/**
 * BinGo – Schedule Service (Member 3)
 */
import api from "../api/apiClient";

export const getSchedules = async (area = "") => {
  const params = area ? { area } : {};
  const res = await api.get("/schedules", { params });
  return res.data.data;
};

export const getScheduleById = async (id) => {
  const res = await api.get(`/schedules/${id}`);
  return res.data.data;
};

export const createSchedule = async (data) => {
  const res = await api.post("/schedules", data);
  return res.data.data;
};

export const updateSchedule = async (id, data) => {
  const res = await api.put(`/schedules/${id}`, data);
  return res.data.data;
};

export const deleteSchedule = async (id) => {
  const res = await api.delete(`/schedules/${id}`);
  return res.data;
};
