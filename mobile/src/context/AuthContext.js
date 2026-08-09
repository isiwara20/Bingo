/**
 * BinGo – Authentication Context
 *
 * Provides authentication state and actions to the entire application.
 *
 * State:
 *   user        – authenticated user object or null
 *   token       – JWT string or null
 *   isLoading   – initial auth check in progress
 *   isLoggedIn  – derived boolean
 *
 * Actions:
 *   login(userData, token) – store credentials
 *   logout()               – clear credentials
 *   updateUser(userData)   – update user profile in context
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_TOKEN = "@bingo_auth_token";
const STORAGE_KEY_USER = "@bingo_auth_user";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored credentials on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedUser] = await AsyncStorage.multiGet([
          STORAGE_KEY_TOKEN,
          STORAGE_KEY_USER,
        ]);

        const tokenValue = storedToken[1];
        const userValue = storedUser[1];

        if (tokenValue && userValue) {
          setToken(tokenValue);
          setUser(JSON.parse(userValue));
        }
      } catch (error) {
        console.error("Failed to load stored auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  /**
   * Store credentials after successful login or registration.
   *
   * @param {object} userData - User object from API response
   * @param {string} authToken - JWT token from API response
   */
  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEY_TOKEN, authToken],
        [STORAGE_KEY_USER, JSON.stringify(userData)],
      ]);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to store auth credentials:", error);
      throw error;
    }
  };

  /**
   * Clear credentials on logout.
   */
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY_TOKEN, STORAGE_KEY_USER]);
    } catch (error) {
      console.error("Failed to clear auth storage:", error);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Update stored user data (e.g., after profile update).
   *
   * @param {object} updatedUser - Updated user object
   */
  const updateUser = async (updatedUser) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_USER,
        JSON.stringify(updatedUser)
      );
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update stored user:", error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isLoggedIn: !!token && !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access auth context.
 * Must be used inside AuthProvider.
 *
 * Usage:
 *   const { user, login, logout, isLoggedIn } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
