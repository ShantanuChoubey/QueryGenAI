import { generateQueries } from '../services/ai.service.js';
import { successResponse } from '../utils/apiResponse.js';
import prisma from '../config/db.js';

/**
 * Handle requests to generate SQL alternatives from a user prompt.
 */
export const generateSqlPrompt = async (req, res, next) => {
  try {
    const { query } = req.body;

    // Call the unified AI service which handles prompt construction and LLM invocation
    const queries = await generateQueries(query);

    // Record AuditLog
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          action: 'SQL_GENERATE',
          userId: req.user.id,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
        },
      }).catch((err) => console.error('Failed to save AuditLog:', err));
    }

    return successResponse(res, 200, 'SQL alternatives generated successfully', queries);
  } catch (error) {
    next(error);
  }
};
