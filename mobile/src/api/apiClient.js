/**
 * BinGo – Centralised Axios API Client
 *
 * All HTTP requests to the backend go through this client.
 * Never import axios directly in screens or components.
 * Use the exported api object or the specific service modules.
 *
 * Features:
 * - Centralised base URL configuration
 * - Automatic JWT token injection from AsyncStorage
 * - Consistent error handling
 * - Request/response logging in development
 */

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiConfig from "../config/apiConfig";

const api = axios.create({
  baseURL: apiConfig.API_BASE_URL,
  timeout: apiConfig.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request Interceptor – inject JWT ────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("@bingo_auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to retrieve token from storage:", error);
    }

    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor – normalise errors ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.error("[API Error]", error.response?.status, error.response?.data);
    }

    // Network error (no response from server)
    if (!error.response) {
      return Promise.reject({
        message:
          "Network error. Please check your connection and ensure the backend is running.",
        isNetworkError: true,
      });
    }

    const { status, data } = error.response;

    // 401 – token expired or invalid
    if (status === 401) {
      // TODO: Emit an event or call AuthContext logout here
      // For now, let the calling code handle 401s
    }

    return Promise.reject({
      message: data?.message || "An unexpected error occurred.",
      status,
      errors: data?.errors || null,
    });
  }
);

export default api;
