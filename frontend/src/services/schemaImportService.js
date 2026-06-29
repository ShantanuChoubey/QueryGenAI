import apiClient from './api.js';

/**
 * Preview SQL DDL import
 */
export const previewSqlImport = async (workspaceId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(`/workspaces/${workspaceId}/import/sql`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data;
};

/**
 * Preview JSON schema import
 */
export const previewJsonImport = async (workspaceId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(`/workspaces/${workspaceId}/import/json`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data;
};

/**
 * Preview CSV schema import
 */
export const previewCsvImport = async (workspaceId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(`/workspaces/${workspaceId}/import/csv`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data;
};

/**
 * Confirm and save the previewed schema to the workspace
 */
export const confirmImport = async (workspaceId, { tables, relationships, conflictStrategy }) => {
  const res = await apiClient.post(`/workspaces/${workspaceId}/import/confirm`, {
    tables,
    relationships,
    conflictStrategy,
  });
  return res.data.data;
};
