const authMiddleware = require('./auth');
const errorHandler = require('./errorHandler');
const rateLimiterMiddleware = require('./rateLimiter');

module.exports = {
  ...authMiddleware,
  errorHandler,
  ...rateLimiterMiddleware,
};
