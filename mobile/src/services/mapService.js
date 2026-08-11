/**
 * BinGo – Map Service (Mobile)
 *
 * Wraps map-related API calls.
 * TODO (Member 2): Expand with filtering and clustering in Sprint 2.
 */

import api from "../api/apiClient";

/**
 * Fetch waste report locations for map display.
 *
 * @returns {Array} report location objects
 */
export const getReportLocations = async () => {
  const response = await api.get("/map/reports");
  return response.data.data;
};

/**
 * Fetch fixed waste locations (recycling centres, collection points).
 *
 * @param {string} [type] - Optional type filter
 * @returns {Array} waste location objects
 */
export const getWasteLocations = async (type = null) => {
  const params = type ? { type } : {};
  const response = await api.get("/map/locations", { params });
  return response.data.data;
};

/**
 * Fetch locations near a coordinate.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radius=5] - Radius in km
 * @returns {Array} nearby location objects
 */
export const getNearbyLocations = async (lat, lng, radius = 5) => {
  const response = await api.get("/map/nearby", {
    params: { lat, lng, radius },
  });
  return response.data.data;
};
