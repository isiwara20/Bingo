/**
 * BinGo – Auth Service (Mobile)
 *
 * Wraps authentication API calls.
 * Import this in screens – never call api directly from screens.
 */

import api from "../api/apiClient";

/**
 * Register a new user.
 *
 * @param {{ name, email, password, phone }} userData
 * @returns {{ user, token }}
 */
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data.data;
};

/**
 * Log in with email and password.
 *
 * @param {{ email, password }} credentials
 * @returns {{ user, token }}
 */
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data.data;
};

/**
 * Log out – notifies the backend (stateless, but good practice).
 */
export const logout = async () => {
  await api.post("/auth/logout");
};

/**
 * Get the authenticated user's profile.
 *
 * @returns {object} user
 */
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};
