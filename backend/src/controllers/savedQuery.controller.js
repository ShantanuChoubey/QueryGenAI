import {
  saveQuery,
  listSavedQueries,
  getSavedQuery,
  updateSavedQuery,
  toggleFavorite,
  deleteSavedQuery,
  searchSavedQueries,
} from '../services/savedQuery.service.js';
import { successResponse } from '../utils/apiResponse.js';

/** POST /saved-queries */
export const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { workspaceId, title, description, naturalLanguagePrompt, generatedSQL, tags } = req.body;
    const saved = await saveQuery(userId, { workspaceId, title, description, naturalLanguagePrompt, generatedSQL, tags });
    return successResponse(res, 201, 'Query saved successfully', saved);
  } catch (err) {
    next(err);
  }
};

/** GET /workspaces/:workspaceId/saved-queries */
export const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { page, limit, search, favorites, sort } = req.query;

    const result = await listSavedQueries(workspaceId, userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
      search: search || '',
      favoritesOnly: favorites === 'true',
      sortOrder: sort === 'asc' ? 'asc' : 'desc',
    });

    return successResponse(res, 200, 'Saved queries retrieved', result);
  } catch (err) {
    next(err);
  }
};

/** GET /saved-queries/:id */
export const getOne = async (req, res, next) => {
  try {
    const sq = await getSavedQuery(req.params.id, req.user.id);
    return successResponse(res, 200, 'Saved query retrieved', sq);
  } catch (err) {
    next(err);
  }
};

/** PATCH /saved-queries/:id */
export const update = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;
    const updated = await updateSavedQuery(req.params.id, req.user.id, { title, description, tags });
    return successResponse(res, 200, 'Saved query updated', updated);
  } catch (err) {
    next(err);
  }
};

/** PATCH /saved-queries/:id/favorite */
export const favorite = async (req, res, next) => {
  try {
    const updated = await toggleFavorite(req.params.id, req.user.id);
    return successResponse(res, 200, 'Favorite status toggled', updated);
  } catch (err) {
    next(err);
  }
};

/** DELETE /saved-queries/:id */
export const remove = async (req, res, next) => {
  try {
    const result = await deleteSavedQuery(req.params.id, req.user.id);
    return successResponse(res, 200, 'Saved query deleted', result);
  } catch (err) {
    next(err);
  }
};

/** GET /saved-queries/search?q=&workspaceId= */
export const search = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q, workspaceId } = req.query;

    if (!q || !workspaceId) {
      const err = new Error('Query parameter "q" and "workspaceId" are required');
      err.status = 400;
      throw err;
    }

    const results = await searchSavedQueries(workspaceId, userId, q);
    return successResponse(res, 200, 'Search results', results);
  } catch (err) {
    next(err);
  }
};
