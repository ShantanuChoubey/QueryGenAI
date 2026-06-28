import * as relationshipService from '../services/relationship.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createRelationship = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const relationship = await relationshipService.createRelationship(userId, req.body);
    return successResponse(res, 201, 'Relationship created successfully', relationship);
  } catch (error) {
    next(error);
  }
};

export const listWorkspaceRelationships = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const relationships = await relationshipService.listWorkspaceRelationships(workspaceId, userId);
    return successResponse(res, 200, 'Relationships retrieved successfully', relationships);
  } catch (error) {
    next(error);
  }
};

export const getRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const relationship = await relationshipService.getRelationship(id, userId);
    return successResponse(res, 200, 'Relationship retrieved successfully', relationship);
  } catch (error) {
    next(error);
  }
};

export const updateRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const relationship = await relationshipService.updateRelationship(id, userId, req.body);
    return successResponse(res, 200, 'Relationship updated successfully', relationship);
  } catch (error) {
    next(error);
  }
};

export const deleteRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await relationshipService.deleteRelationship(id, userId);
    return successResponse(res, 200, 'Relationship deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
