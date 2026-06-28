import apiClient from './api.js';

export const listWorkspaces = async () => {
  const res = await apiClient.get('/workspaces');
  return res.data.data;
};

export const getWorkspace = async (id) => {
  const res = await apiClient.get(`/workspaces/${id}`);
  return res.data.data;
};

export const createWorkspace = async (data) => {
  const res = await apiClient.post('/workspaces', data);
  return res.data.data;
};

export const updateWorkspace = async (id, data) => {
  const res = await apiClient.patch(`/workspaces/${id}`, data);
  return res.data.data;
};

export const deleteWorkspace = async (id) => {
  const res = await apiClient.delete(`/workspaces/${id}`);
  return res.data.data;
};
