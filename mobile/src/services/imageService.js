/**
 * BinGo – Image Service (Mobile)
 *
 * Abstraction over react-native-image-picker.
 * Use this service in screens instead of calling the library directly.
 * Handles runtime permissions for camera access on Android 6.0+.
 *
 * TODO (Sprint 2+): Replace local URI handling with Cloudinary upload.
 *   Current implementation returns a local device URI only.
 *   The URI is sent to the backend as imageUrl for now.
 *   Cloud storage integration is required before production.
 */

import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { PermissionsAndroid, Platform } from "react-native";

const IMAGE_OPTIONS = {
  mediaType: "photo",
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  includeBase64: false,
};

/**
 * Request camera permission on Android 6.0+
 * @returns {Promise<boolean>}
 */
const requestCameraPermission = async () => {
  if (Platform.OS !== "android") {
    return true; // iOS permissions handled by OS
  }

  try {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: "Camera Permission",
        message: "BinGo needs access to your camera to take photos of waste.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Deny",
        buttonPositive: "Allow",
      }
    );

    return permission === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn("Camera permission error:", err);
    return false;
  }
};

/**
 * Open the camera to take a photo.
 *
 * @returns {Promise<{ uri: string, type: string, name: string }>}
 */
export const takePhoto = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const hasPermission = await requestCameraPermission();
      
      if (!hasPermission) {
        reject({
          code: "PERMISSION_DENIED",
          message: "Camera permission denied. Check your device settings.",
        });
        return;
      }

      launchCamera(IMAGE_OPTIONS, (response) => {
        if (response.didCancel) {
          reject({ code: "CANCELLED", message: "Camera cancelled." });
          return;
        }
        if (response.errorCode) {
          reject({
            code: response.errorCode,
            message: response.errorMessage || "Camera error.",
          });
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) {
          reject({ code: "NO_IMAGE", message: "No image captured." });
          return;
        }

        resolve({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: asset.fileName || `report_${Date.now()}.jpg`,
        });
      });
    } catch (err) {
      reject({
        code: "PERMISSION_ERROR",
        message: "Failed to check camera permission.",
      });
    }
  });
};

/**
 * Open the photo library to select an image.
 *
 * @returns {Promise<{ uri: string, type: string, name: string }>}
 */
export const pickImageFromLibrary = () => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(IMAGE_OPTIONS, (response) => {
      if (response.didCancel) {
        reject({ code: "CANCELLED", message: "Image selection cancelled." });
        return;
      }
      if (response.errorCode) {
        reject({
          code: response.errorCode,
          message: response.errorMessage || "Image picker error.",
        });
        return;
      }

      const asset = response.assets?.[0];
      if (!asset) {
        reject({ code: "NO_IMAGE", message: "No image selected." });
        return;
      }

      resolve({
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || `report_${Date.now()}.jpg`,
      });
    });
  });
};
