/**
 * BinGo – API Configuration
 *
 * Central place to configure backend URL.
 *
 * Android Emulator  → 10.0.2.2 maps to host machine's localhost
 * Physical Device   → Use your machine's LAN IP (e.g., 192.168.1.x)
 * Web/Localhost     → localhost
 *
 * For production, replace with your deployed backend URL.
 *
 * Current LAN IP: 192.168.1.8
 * Make sure your phone and PC are on the same Wi-Fi network.
 */

// Physical device: use LAN IP so the phone can reach the backend on your PC
// Android emulator fallback: 10.0.2.2
const API_BASE_URL =
  process.env.API_BASE_URL || "http://192.168.1.8:5000/api/v1";

export default {
  API_BASE_URL,
  TIMEOUT: 15000, // 15 seconds
};
