import apiClient from './api.js';

export const listColumns = async (tableId) => {
  const res = await apiClient.get(`/tables/${tableId}/columns`);
  return res.data.data;
};

export const createColumn = async (tableId, data) => {
  const res = await apiClient.post(`/tables/${tableId}/columns`, data);
  return res.data.data;
};

export const getColumn = async (id) => {
  const res = await apiClient.get(`/columns/${id}`);
  return res.data.data;
};

export const updateColumn = async (id, data) => {
  const res = await apiClient.patch(`/columns/${id}`, data);
  return res.data.data;
};

export const deleteColumn = async (id) => {
  const res = await apiClient.delete(`/columns/${id}`);
  return res.data.data;
};
