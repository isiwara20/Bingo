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

// ADB reverse tcp:5000 tcp:5000 is active — localhost tunnels to PC via USB
// Run: adb reverse tcp:5000 tcp:5000 && adb reverse tcp:8081 tcp:8081
const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:5000/api/v1";

export default {
  API_BASE_URL,
  TIMEOUT: 15000, // 15 seconds
};
