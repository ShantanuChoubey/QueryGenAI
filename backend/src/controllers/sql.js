import { generateQueries } from '../services/ai.service.js';
import { successResponse } from '../utils/apiResponse.js';
import prisma from '../config/db.js';

/**
 * Handle requests to generate SQL alternatives from a user prompt.
 * Persists the query and all variants to the database for history.
 */
export const generateSqlPrompt = async (req, res, next) => {
  try {
    const { query } = req.body;
    const startTime = Date.now();

    // Call the unified AI service which handles prompt construction and LLM invocation
    const queries = await generateQueries(query);

    const executionTime = Date.now() - startTime;

    // Persist Query + QueryVariants to the database for history tracking
    if (req.user?.id) {
      const recommendedSQL = queries?.recommendedQuery?.sql || null;
      const allVariants = Array.isArray(queries?.alternatives) ? queries.alternatives : [];

      // Save the query record and all variants in a single transaction
      prisma.query
        .create({
          data: {
            prompt: query,
            selectedSQL: recommendedSQL,
            executionStatus: 'SUCCESS',
            executionTime,
            userId: req.user.id,
            variants: {
              create: allVariants.map((v) => ({
                sql: v.sql,
                explanation: v.explanation || null,
                ranking: typeof v.ranking === 'number' ? v.ranking : 0,
              })),
            },
          },
        })
        .catch((err) => console.error('Failed to save Query to history:', err));

      // Record AuditLog
      prisma.auditLog
        .create({
          data: {
            action: 'SQL_GENERATE',
            userId: req.user.id,
            ipAddress:
              req.ip ||
              req.headers['x-forwarded-for'] ||
              req.socket.remoteAddress ||
              null,
          },
        })
        .catch((err) => console.error('Failed to save AuditLog:', err));
    }

    return successResponse(res, 200, 'SQL alternatives generated successfully', queries);
  } catch (error) {
    next(error);
  }
};
