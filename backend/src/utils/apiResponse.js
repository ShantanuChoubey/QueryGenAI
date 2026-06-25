/**
 * Helper to construct a standardized API success response.
 */
export function successResponse(res, statusCode = 200, message = 'Success', data = null) {
  const requestId = res.req?.requestId || null;

  return res.status(statusCode).json({
    success: true,
    requestId,
    message,
    data,
  });
}

/**
 * Helper to construct a standardized API error response.
 */
export function errorResponse(res, statusCode = 500, message = 'Error', error = null) {
  const requestId = res.req?.requestId || null;

  return res.status(statusCode).json({
    success: false,
    requestId,
    message,
    error,
  });
}
