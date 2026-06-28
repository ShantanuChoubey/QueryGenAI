const store = {};

/**
 * Helper to build an in-memory IP-based rate limiting middleware.
 */
function createRateLimiter({ windowMs, max, message }) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const routeKey = req.baseUrl + req.path;

    if (!store[ip]) {
      store[ip] = {};
    }

    if (!store[ip][routeKey]) {
      store[ip][routeKey] = [];
    }

    // Filter out requests that are older than the sliding window limit
    store[ip][routeKey] = store[ip][routeKey].filter((timestamp) => now - timestamp < windowMs);

    const currentRequests = store[ip][routeKey].length;

    if (currentRequests >= max) {
      const oldestRequest = store[ip][routeKey][0];
      const timeElapsed = now - oldestRequest;
      const timeRemaining = windowMs - timeElapsed;
      const retryAfterSeconds = Math.ceil(timeRemaining / 1000);

      // Return consistent HTTP 429 Too Many Requests response
      return res.status(429).json({
        success: false,
        requestId: req.requestId || null,
        message,
        error: 'TooManyRequests',
        retryAfter: `${retryAfterSeconds}s`,
      });
    }

    // Log current request timestamp and proceed
    store[ip][routeKey].push(now);
    next();
  };
}

// 1. General API Limiter (100 requests per 15 minutes)
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

// 2. AI SQL Generator Limiter (10 requests per 15 minutes)
export const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many SQL generation requests, please try again in 15 minutes.',
});
