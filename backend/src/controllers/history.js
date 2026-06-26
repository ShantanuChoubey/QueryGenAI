import prisma from '../config/db.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/v1/history
 * Returns the authenticated user's query history with variants,
 * ordered by most recent first. Supports pagination.
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [queries, total] = await Promise.all([
      prisma.query.findMany({
        where: { userId: req.user.id },
        select: {
          id: true,
          prompt: true,
          selectedSQL: true,
          executionStatus: true,
          executionTime: true,
          createdAt: true,
          variants: {
            select: {
              id: true,
              sql: true,
              explanation: true,
              ranking: true,
            },
            orderBy: { ranking: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.query.count({ where: { userId: req.user.id } }),
    ]);

    return successResponse(res, 200, 'Query history retrieved successfully', {
      queries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/history/:id
 * Deletes a single query history entry belonging to the authenticated user.
 */
export const deleteHistoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify the query belongs to the requesting user before deleting
    const query = await prisma.query.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    });

    if (!query) {
      const err = new Error('Query not found or you do not have permission to delete it.');
      err.status = 404;
      return next(err);
    }

    await prisma.query.delete({ where: { id } });

    return successResponse(res, 200, 'Query deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
