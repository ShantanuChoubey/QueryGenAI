import apiClient from './api.js';

/**
 * Fetch the ER diagram data for a workspace.
 * Returns { workspaceName, databaseType, tables, relationships }
 *
 * @param {string} workspaceId
 * @returns {Promise<Object>}
 */
export const getWorkspaceDiagram = async (workspaceId) => {
  const res = await apiClient.get(`/workspaces/${workspaceId}/diagram`);
  return res.data.data;
};
