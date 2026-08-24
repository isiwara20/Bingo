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
 * Send a 6-digit OTP to the given phone number via text.lk SMS.
 * The user must already exist in the database with this phone number.
 *
 * @param {string} phone - Phone number to send OTP to
 * @returns {Promise<void>}
 */
export const sendOtp = async (phone) => {
  await api.post("/auth/send-otp", { phone });
};

/**
 * Verify the OTP entered by the user.
 * On success, the backend marks the phone as verified.
 *
 * @param {string} phone - Phone number
 * @param {string} otp   - 6-digit OTP entered by user
 * @returns {{ phoneVerified: boolean }}
 */
export const verifyOtp = async (phone, otp) => {
  const response = await api.post("/auth/verify-otp", { phone, otp });
  return response.data.data;
};
