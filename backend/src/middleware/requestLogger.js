/**
 * Middleware to log structured JSON details for every completed HTTP request.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Listen for the response finish event to ensure payload delivery is complete
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const log = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || null,
      method: req.method,
      endpoint: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      authenticatedUserId: req.user?.id || null,
      clientIp,
    };

    console.log(JSON.stringify(log));
  });

  next();
};
