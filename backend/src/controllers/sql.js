import { generateQueries } from '../services/ai.service.js';

/**
 * Handle requests to generate SQL alternatives from a user prompt.
 */
export const generateSqlPrompt = async (req, res, next) => {
  try {
    const { query } = req.body;

    // Call the unified AI service which handles prompt construction and LLM invocation
    const queries = await generateQueries(query);

    return res.status(200).json({
      success: true,
      queries,
    });
  } catch (error) {
    next(error);
  }
};
