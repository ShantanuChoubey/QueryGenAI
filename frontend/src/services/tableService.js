import apiClient from './api.js';

export const listTables = async (workspaceId) => {
  const res = await apiClient.get(`/workspaces/${workspaceId}/tables`);
  return res.data.data;
};

export const createTable = async (workspaceId, data) => {
  const res = await apiClient.post(`/workspaces/${workspaceId}/tables`, data);
  return res.data.data;
};

export const getTable = async (id) => {
  const res = await apiClient.get(`/tables/${id}`);
  return res.data.data;
};

export const updateTable = async (id, data) => {
  const res = await apiClient.patch(`/tables/${id}`, data);
  return res.data.data;
};

export const deleteTable = async (id) => {
  const res = await apiClient.delete(`/tables/${id}`);
  return res.data.data;
};
