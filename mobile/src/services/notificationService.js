/**
 * BinGo – Notification Service
 * Member 4 – Notifications
 *
 * All notification API calls go through this module.
 * Screens must NOT import api directly.
 */

import api from "../api/apiClient";

/**
 * List the authenticated user's notifications, newest first, paginated.
 *
 * @param {{ type?: string, page?: number, limit?: number }} params
 * @returns {{ items: Array, pagination: object }}
 */
export const getNotifications = async ({ type, page = 1, limit = 20 } = {}) => {
  const params = { page, limit };
  if (type && type !== "all") params.type = type;

  const response = await api.get("/notifications", { params });
  return { items: response.data.data, pagination: response.data.pagination };
};

/**
 * Mark a single notification as read.
 *
 * @param {string} notificationId
 * @returns {object} updated notification
 */
export const markAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data.data;
};

/**
 * Mark all of the authenticated user's notifications as read.
 */
export const markAllAsRead = async () => {
  await api.patch("/notifications/read-all");
};

/**
 * Get the authenticated user's notification settings.
 *
 * @returns {object} settings
 */
export const getNotificationSettings = async () => {
  const response = await api.get("/notifications/settings");
  return response.data.data;
};

/**
 * Update the authenticated user's notification settings (partial update).
 *
 * @param {object} settings
 * @returns {object} updated settings
 */
export const updateNotificationSettings = async (settings) => {
  const response = await api.put("/notifications/settings", settings);
  return response.data.data;
};
