/**
 * BinGo – Report Service
 * Member 2 – Illegal Dumping Reporting (US-M2-01 to US-M2-05)
 *
 * All report API calls go through this module.
 * Screens must NOT import api directly.
 */

import api from "../api/apiClient";

/**
 * Submit a new illegal dumping report.
 * US-M2-01, US-M2-02, US-M2-03, US-M2-04
 *
 * @param {{
 *   wasteType: string,
 *   description: string,
 *   latitude: number,
 *   longitude: number,
 *   address?: string,
 *   imageUrl?: string|null
 * }} reportData
 * @returns {object} created report
 */
export const createReport = async (reportData) => {
  const response = await api.post("/reports", reportData);
  return response.data.data;
};

/**
 * Get the authenticated user's own submitted reports.
 * US-M2-05
 *
 * @returns {Array} reports sorted newest first
 */
export const getMyReports = async () => {
  const response = await api.get("/reports/my");
  return response.data.data;
};

/**
 * Get a single report by ID.
 * Ownership enforced server-side.
 *
 * @param {string} reportId
 * @returns {object} report with populated fields
 */
export const getReportById = async (reportId) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data.data;
};
