/**
 * BinGo – Geocoding Service (OpenStreetMap Nominatim)
 *
 * Converts GPS coordinates to readable addresses using Nominatim API.
 * Free tier: ~1 request/second, no key required, no registration needed.
 *
 * API Docs: https://nominatim.org/release-docs/latest/api/Reverse/
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT = 5000; // 5 seconds

// Cache to avoid duplicate requests for same coordinates
const addressCache = new Map();

/**
 * Get readable address from GPS coordinates using Nominatim.
 * Results are cached to minimize API calls.
 *
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {Promise<string>} Readable address or fallback text
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  // Round to 4 decimals (~10 meters precision) for caching
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  // Return cached result if available
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        method: "GET",
        headers: {
          "User-Agent": "BinGo-Mobile-App",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Nominatim API error: ${response.status}`);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    const data = await response.json();

    // Build readable address from Nominatim response
    let address = "Unknown Location";

    if (data.address) {
      const addr = data.address;

      // Prioritize: road, village/suburb, city, state
      if (addr.road) {
        address = addr.road;
        if (addr.suburb) address += `, ${addr.suburb}`;
        if (addr.city) address += `, ${addr.city}`;
      } else if (addr.suburb) {
        address = addr.suburb;
        if (addr.city) address += `, ${addr.city}`;
      } else if (addr.city) {
        address = addr.city;
        if (addr.state) address += `, ${addr.state}`;
      } else if (data.display_name) {
        // Fallback to full display name
        const parts = data.display_name.split(",");
        address = parts.slice(0, 3).join(",").trim(); // First 3 parts
      }
    }

    // Cache the result
    addressCache.set(cacheKey, address);
    return address;
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("Nominatim request timed out");
    } else {
      console.warn("Geocoding error:", error);
    }

    // Fallback: return coordinates as string
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Forward geocoding: Convert address to GPS coordinates.
 * (Optional, for future use)
 *
 * @param {string} address - Street address or location name
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCoordinatesFromAddress = async (address) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        method: "GET",
        headers: {
          "User-Agent": "BinGo-Mobile-App",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok || response.status !== 200) {
      return null;
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.warn("Address geocoding error:", error);
    return null;
  }
};

/**
 * Clear the address cache (for testing or memory management).
 */
export const clearAddressCache = () => {
  addressCache.clear();
};

/**
 * Get cache size (for debugging).
 *
 * @returns {number} Number of cached addresses
 */
export const getCacheSize = () => {
  return addressCache.size;
};
