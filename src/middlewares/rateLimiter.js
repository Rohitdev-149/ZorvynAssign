const rateLimit = require('express-rate-limit');

/**
 * API rate limiter configuration
 * Creates a rate limiter with sensible defaults
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // per window
    message = 'Too many requests from this IP, please try again later',
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      statusCode: 429,
      message,
    },
    standardHeaders,
    legacyHeaders,
  });
};

/**
 * Stricter rate limiter for auth endpoints (login, register)
 */
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 attempts per hour
  message: 'Too many authentication attempts, please try again later',
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
};
