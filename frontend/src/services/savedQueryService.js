import apiClient from './api.js';

/**
 * Save a newly generated SQL query to a workspace.
 */
export const saveQuery = async ({ workspaceId, title, description, naturalLanguagePrompt, generatedSQL, tags = [] }) => {
  const res = await apiClient.post('/saved-queries', {
    workspaceId,
    title,
    description,
    naturalLanguagePrompt,
    generatedSQL,
    tags,
  });
  return res.data.data;
};

/**
 * List saved queries for a workspace with optional filters.
 */
export const listSavedQueries = async (workspaceId, { page = 1, limit = 20, search = '', favorites = false, sort = 'desc' } = {}) => {
  const params = new URLSearchParams({ page, limit, sort });
  if (search) params.set('search', search);
  if (favorites) params.set('favorites', 'true');
  const res = await apiClient.get(`/workspaces/${workspaceId}/saved-queries?${params}`);
  return res.data.data;
};

/**
 * Get a single saved query with full SQL.
 */
export const getSavedQuery = async (id) => {
  const res = await apiClient.get(`/saved-queries/${id}`);
  return res.data.data;
};

/**
 * Update title, description, or tags of a saved query.
 */
export const updateSavedQuery = async (id, data) => {
  const res = await apiClient.patch(`/saved-queries/${id}`, data);
  return res.data.data;
};

/**
 * Toggle favorite status.
 */
export const toggleFavorite = async (id) => {
  const res = await apiClient.patch(`/saved-queries/${id}/favorite`);
  return res.data.data;
};

/**
 * Delete a saved query.
 */
export const deleteSavedQuery = async (id) => {
  const res = await apiClient.delete(`/saved-queries/${id}`);
  return res.data.data;
};

/**
 * Full-text search across workspace saved queries.
 */
export const searchSavedQueries = async (workspaceId, q) => {
  const res = await apiClient.get(`/saved-queries/search?q=${encodeURIComponent(q)}&workspaceId=${workspaceId}`);
  return res.data.data;
};
