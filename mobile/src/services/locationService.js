/**
 * BinGo – Location Service (Mobile)
 *
 * Abstraction over react-native-geolocation-service.
 * Components should use this service, not call Geolocation directly.
 *
 * This approach:
 * - Centralises permission handling
 * - Makes testing easier (mock this module)
 * - Keeps location logic out of screens
 */

import { Platform, PermissionsAndroid } from "react-native";
import Geolocation from "react-native-geolocation-service";

/**
 * Request location permission on Android.
 * iOS permissions are handled via Info.plist.
 *
 * @returns {boolean} true if permission granted
 */
export const requestLocationPermission = async () => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "BinGo Location Permission",
          message:
            "BinGo needs access to your location to tag waste reports accurately.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "Allow",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error("Location permission error:", error);
      return false;
    }
  }

  // iOS – permission is requested automatically by the library
  return true;
};

/**
 * Get the device's current GPS position.
 *
 * @returns {Promise<{ latitude: number, longitude: number }>}
 */
export const getCurrentLocation = () => {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      reject({
        code: "PERMISSION_DENIED",
        message:
          "Location permission denied. Please enable location access in Settings.",
      });
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getLocationErrorMessage(error.code),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
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
