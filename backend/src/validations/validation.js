import { errorResponse } from '../utils/apiResponse.js';

/**
 * Helper middleware that parses and validates request inputs against a Zod schema.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => {
      const fieldPath = err.path.slice(1).join('.');
      return {
        field: fieldPath || 'root',
        message: err.message,
      };
    });

    return errorResponse(res, 400, 'Request validation failed', {
      error: 'ValidationError',
      details: errorDetails,
    });
  }

  // Assign the parsed/sanitized data back to request properties
  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.query !== undefined) req.query = result.data.query;
  if (result.data.params !== undefined) req.params = result.data.params;

  next();
};
