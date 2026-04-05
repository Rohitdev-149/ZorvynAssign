/**
 * JWT configuration object.
 * Reads values from environment variables with sensible defaults.
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = jwtConfig;
