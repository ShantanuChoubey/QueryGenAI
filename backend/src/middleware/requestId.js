import crypto from 'crypto';

/**
 * Middleware that assigns a unique request ID (UUID) to every incoming request.
 * Reuses client-provided 'X-Request-ID' headers if valid.
 */
export const requestIdMiddleware = (req, res, next) => {
  const clientHeader = req.headers['x-request-id'];
  let requestId;

  // Validate incoming header parameter context (non-empty string of reasonable length)
  if (
    typeof clientHeader === 'string' &&
    clientHeader.trim().length > 0 &&
    clientHeader.trim().length <= 100
  ) {
    requestId = clientHeader.trim();
  } else {
    requestId = crypto.randomUUID();
  }

  // Set the identifier on the request object and the response header
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};
