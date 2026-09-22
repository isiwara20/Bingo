/**
 * BinGo – Auth Service (Mobile)
 *
 * Wraps all authentication-related API calls.
 * Import this in screens — never call api directly from screens.
 */

import api from "../api/apiClient";

/**
 * Register a new user.
 *
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   phone?: string,
 *   role?: string,
 *   address?: string,
 *   communityName?: string,
 *   location?: { latitude: number, longitude: number }
 * }} userData
 * @returns {{ user, token }}
 */
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data.data;
};

/**
 * Log in with email and password.
 * Works for all roles including admin.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {{ user, token }}
 */
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data.data;
};

/**
 * Log out — notifies the backend to invalidate session if applicable.
 */
export const logout = async () => {
  await api.post("/auth/logout");
};

/**
 * Get the authenticated user's profile.
 * @returns {object} user
 */
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

/**
 * Send a 6-digit OTP to the given WhatsApp number via WAClient.
 * @param {string} whatsappNumber
 */
export const sendOtp = async (whatsappNumber) => {
  await api.post("/auth/send-otp", { whatsappNumber });
};

/**
 * Verify the OTP entered by the user.
 * @param {string} whatsappNumber
 * @param {string} otp
 */
export const verifyOtp = async (whatsappNumber, otp) => {
  const response = await api.post("/auth/verify-otp", { whatsappNumber, otp });
  return response.data.data;
};
