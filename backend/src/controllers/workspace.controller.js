import * as workspaceService from '../services/workspace.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const workspace = await workspaceService.createWorkspace(userId, req.body);
    return successResponse(res, 201, 'Workspace created successfully', workspace);
  } catch (error) {
    next(error);
  }
};

export const listUserWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const workspaces = await workspaceService.listUserWorkspaces(userId);
    return successResponse(res, 200, 'Workspaces retrieved successfully', workspaces);
  } catch (error) {
    next(error);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const workspace = await workspaceService.getWorkspace(id, userId);
    return successResponse(res, 200, 'Workspace retrieved successfully', workspace);
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const workspace = await workspaceService.updateWorkspace(id, userId, req.body);
    return successResponse(res, 200, 'Workspace updated successfully', workspace);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await workspaceService.deleteWorkspace(id, userId);
    return successResponse(res, 200, 'Workspace deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
