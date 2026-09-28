/**
 * BinGo – Location Service (Mobile)
 *
 * Uses React Native's built-in Geolocation API with fallback to mock location.
 * Components should use this service, not call Geolocation directly.
 */

import { Platform, PermissionsAndroid, Alert } from "react-native";

/**
 * Request location permission on Android.
 * iOS permissions are handled via Info.plist.
 *
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestLocationPermission = async () => {
  if (Platform.OS !== "android") {
    // iOS – permission is handled at app level
    return true;
  }

  try {
    // Check if already granted
    const fineGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (fineGranted) {
      return true;
    }

    // Request both fine and coarse location permissions
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message:
          "BinGo needs access to your location to tag waste reports accurately.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Deny",
        buttonPositive: "Allow",
      }
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error("Location permission error:", error);
    return false;
  }
};

/**
 * Get the device's current GPS position.
 * Falls back to mock location (Colombo, Sri Lanka) if native geolocation unavailable.
 *
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number }>}
 */
export const getCurrentLocation = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        reject({
          code: "PERMISSION_DENIED",
          message:
            "Location permission denied. Please enable location access in device Settings.",
        });
        return;
      }

      // Try using the built-in Geolocation API
      if (global.navigator && global.navigator.geolocation) {
        try {
          global.navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            (error) => {
              console.warn("Geolocation error:", error);
              useMockLocation(resolve);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            }
          );
          return;
        } catch (err) {
          console.warn("Geolocation API failed:", err);
        }
      }

      // Fallback to mock location
      useMockLocation(resolve);
    } catch (err) {
      console.error("Location service error:", err);
      reject({
        code: "LOCATION_SERVICE_ERROR",
        message: "Location service error. Please try again.",
      });
    }
  });
};

/**
 * Use mock location for development/testing.
 * Returns a location in Colombo, Sri Lanka with slight randomization.
 *
 * @param {function} resolve - Promise resolve callback
 */
const useMockLocation = (resolve) => {
  // Colombo, Sri Lanka coordinates (with small random offset for testing)
  const baseLat = 6.9271;
  const baseLon = 79.8612;
  const randomOffset = () => (Math.random() - 0.5) * 0.01; // ±0.005 degrees

  resolve({
    latitude: baseLat + randomOffset(),
    longitude: baseLon + randomOffset(),
    accuracy: 50, // 50 meters
  });
};

/**
 * Convert Geolocation error codes to user-friendly messages.
 *
 * @param {number} code - Error code from Geolocation
 * @returns {string} User-friendly message
 */
const getLocationErrorMessage = (code) => {
  switch (code) {
    case 1:
      return "Location permission denied. Please enable in Settings.";
    case 2:
      return "Location unavailable. Please check your GPS settings.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Unable to get your location. Please try again.";
  }
};
