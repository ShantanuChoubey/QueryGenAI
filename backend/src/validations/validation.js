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

    return res.status(400).json({
      error: 'ValidationError',
      message: 'Request validation failed',
      details: errorDetails,
    });
  }

  // Assign the parsed/sanitized data back to request properties
  req.body = result.data.body;
  req.query = result.data.query;
  req.params = result.data.params;

  next();
};
