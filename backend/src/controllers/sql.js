import { getSanitizedSchema } from '../services/schema.js';
import { buildPrompt } from '../services/promptBuilder.js';

/**
 * Handle requests to prepare the prompt context for SQL generation.
 */
export const generateSqlPrompt = async (req, res, next) => {
  try {
    const { query } = req.body;

    // 1. Fetch sanitized database schema
    const schema = getSanitizedSchema();

    // 2. Construct the structured prompt context
    const prompt = buildPrompt(query, schema);

    // 3. Return the response
    return res.status(200).json({
      success: true,
      prompt,
      schema,
    });
  } catch (error) {
    next(error);
  }
};
