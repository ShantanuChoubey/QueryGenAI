import * as columnService from '../services/column.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createColumn = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const userId = req.user.id;
    const column = await columnService.createColumn(tableId, userId, req.body);
    return successResponse(res, 201, 'Column created successfully', column);
  } catch (error) {
    next(error);
  }
};

export const listTableColumns = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const userId = req.user.id;
    const columns = await columnService.listTableColumns(tableId, userId);
    return successResponse(res, 200, 'Columns retrieved successfully', columns);
  } catch (error) {
    next(error);
  }
};

export const getColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const column = await columnService.getColumn(id, userId);
    return successResponse(res, 200, 'Column retrieved successfully', column);
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const column = await columnService.updateColumn(id, userId, req.body);
    return successResponse(res, 200, 'Column updated successfully', column);
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await columnService.deleteColumn(id, userId);
    return successResponse(res, 200, 'Column deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
