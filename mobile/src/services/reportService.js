/**
 * BinGo – Report Service (Mobile)
 *
 * Wraps waste report API calls.
 *
 * TODO (Member 2): Connect image upload to this service in Sprint 2.
 */

import api from "../api/apiClient";

/**
 * Submit a new waste report.
 *
 * @param {{ description, wasteType, latitude, longitude, address, imageUrl }} reportData
 * @returns {object} created report
 */
export const createReport = async (reportData) => {
  const response = await api.post("/reports", reportData);
  return response.data.data;
};

/**
 * Get the authenticated user's reports.
 *
 * @returns {Array} reports
 */
export const getMyReports = async () => {
  const response = await api.get("/reports/my");
  return response.data.data;
};

/**
 * Get a single report by ID.
 *
 * @param {string} reportId
 * @returns {object} report
 */
export const getReportById = async (reportId) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data.data;
};
