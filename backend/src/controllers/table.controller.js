import * as tableService from '../services/table.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createTable = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const table = await tableService.createTable(workspaceId, userId, req.body);
    return successResponse(res, 201, 'Table created successfully', table);
  } catch (error) {
    next(error);
  }
};

export const listWorkspaceTables = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const tables = await tableService.listWorkspaceTables(workspaceId, userId);
    return successResponse(res, 200, 'Tables retrieved successfully', tables);
  } catch (error) {
    next(error);
  }
};

export const getTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const table = await tableService.getTable(id, userId);
    return successResponse(res, 200, 'Table retrieved successfully', table);
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const table = await tableService.updateTable(id, userId, req.body);
    return successResponse(res, 200, 'Table updated successfully', table);
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await tableService.deleteTable(id, userId);
    return successResponse(res, 200, 'Table deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
