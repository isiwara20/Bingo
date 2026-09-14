/**
 * BinGo – Community Service
 * Member 4 – Community Coordination, Notifications & Rewards
 *
 * All community API calls go through this module.
 * Screens must NOT import api directly.
 */

import api from "../api/apiClient";

/**
 * List community posts/events/announcements, newest first, paginated.
 *
 * @param {{ type?: string, search?: string, page?: number, limit?: number }} params
 * @returns {{ items: Array, pagination: object }}
 */
export const getCommunityPosts = async ({ type, search, page = 1, limit = 10 } = {}) => {
  const params = { page, limit };
  if (type && type !== "all") params.type = type;
  if (search && search.trim()) params.search = search.trim();

  const response = await api.get("/community", { params });
  return { items: response.data.data, pagination: response.data.pagination };
};

/**
 * Get a single post/event by id.
 *
 * @param {string} postId
 * @returns {object} post
 */
export const getCommunityPostById = async (postId) => {
  const response = await api.get(`/community/${postId}`);
  return response.data.data;
};

/**
 * Create a new post/event/announcement.
 *
 * @param {{ title: string, content: string, type?: string, imageUrl?: string, eventDate?: string, location?: string }} postData
 * @returns {object} created post
 */
export const createCommunityPost = async (postData) => {
  const response = await api.post("/community", postData);
  return response.data.data;
};

/**
 * Update an existing post/event (author or waste_authority only).
 *
 * @param {string} postId
 * @param {object} postData
 * @returns {object} updated post
 */
export const updateCommunityPost = async (postId, postData) => {
  const response = await api.put(`/community/${postId}`, postData);
  return response.data.data;
};

/**
 * Delete a post/event (author or waste_authority only).
 *
 * @param {string} postId
 */
export const deleteCommunityPost = async (postId) => {
  await api.delete(`/community/${postId}`);
};

/**
 * Join an event as the authenticated user.
 *
 * @param {string} postId
 * @returns {{ attendeeCount: number, isAttending: boolean }}
 */
export const joinCommunityEvent = async (postId) => {
  const response = await api.post(`/community/${postId}/join`);
  return response.data.data;
};

/**
 * Leave an event as the authenticated user.
 *
 * @param {string} postId
 * @returns {{ attendeeCount: number, isAttending: boolean }}
 */
export const leaveCommunityEvent = async (postId) => {
  const response = await api.delete(`/community/${postId}/join`);
  return response.data.data;
};

/**
 * Events the authenticated user has joined, split into upcoming/completed.
 *
 * @returns {{ upcoming: Array, completed: Array }}
 */
export const getMyCommunityEvents = async () => {
  const response = await api.get("/community/mine");
  return response.data.data;
};
