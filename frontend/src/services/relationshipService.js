import apiClient from './api.js';

export const listRelationships = async (workspaceId) => {
  const res = await apiClient.get(`/workspaces/${workspaceId}/relationships`);
  return res.data.data;
};

export const createRelationship = async (data) => {
  const res = await apiClient.post('/relationships', data);
  return res.data.data;
};

export const getRelationship = async (id) => {
  const res = await apiClient.get(`/relationships/${id}`);
  return res.data.data;
};

export const updateRelationship = async (id, data) => {
  const res = await apiClient.patch(`/relationships/${id}`, data);
  return res.data.data;
};

export const deleteRelationship = async (id) => {
  const res = await apiClient.delete(`/relationships/${id}`);
  return res.data.data;
};
