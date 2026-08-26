/**
 * BinGo – Reminder Service (Member 3 – Feature 2)
 */
import api from "../api/apiClient";

export const getReminders = async (area = "") => {
  const params = area ? { area } : {};
  const res = await api.get("/reminders", { params });
  return res.data.data;
};

export const getAllReminders = async (area = "", type = "") => {
  const params = {};
  if (area) params.area = area;
  if (type) params.type = type;
  const res = await api.get("/reminders/all", { params });
  return res.data.data;
};

export const createReminder = async (data) => {
  const res = await api.post("/reminders", data);
  return res.data.data;
};

export const updateReminder = async (id, data) => {
  const res = await api.put(`/reminders/${id}`, data);
  return res.data.data;
};

export const deleteReminder = async (id) => {
  const res = await api.delete(`/reminders/${id}`);
  return res.data;
};
