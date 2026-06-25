/**
 * Backend utility helpers.
 */
export function formatError(error) {
  return {
    message: error.message || 'An error occurred',
    code: error.code || 'UNKNOWN_ERROR',
  };
}
