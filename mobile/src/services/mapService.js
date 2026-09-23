/**
 * BinGo – Map Service
 * Member 2 – Interactive Waste Map (US-M2-06, US-M2-07)
 *
 * All map API calls go through this module.
 */

import api from "../api/apiClient";

/**
 * Fetch active illegal dumping report locations for map markers.
 * Returns only pending + under_review reports.
 * Authenticated endpoint.
 *
 * @returns {Array} report location objects with location, wasteType, status
 */
export const getReportLocations = async () => {
  const response = await api.get("/map/reports");
  return response.data.data;
};

/**
 * Fetch waste facility locations (recycling centres, collection points).
 * Public endpoint.
 *
 * @param {string|null} type - Optional: 'recycling_centre' | 'collection_point' | 'bin'
 * @returns {Array} WasteLocation objects
 */
export const getWasteLocations = async (type = null) => {
  const params = type ? { type } : {};
  const response = await api.get("/map/locations", { params });
  return response.data.data;
};

/**
 * Fetch waste facility locations within a radius.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in km (default 5)
 * @returns {Array} nearby WasteLocation objects
 */
export const getNearbyLocations = async (lat, lng, radius = 5) => {
  const response = await api.get("/map/nearby", {
    params: { lat, lng, radius },
  });
  return response.data.data;
};
