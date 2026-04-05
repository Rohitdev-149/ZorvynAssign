/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use a proper logger like Winston/Pino)
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
  });

  // Use ApiError or default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || [];

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: validationErrors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `${field} already exists`,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Invalid ${err.path}`,
    });
  }

  const normalizedErrors =
    errors.length > 0
      ? errors.map((item) => ({
          message: item.message,
          field: item.path || item.context?.key,
        }))
      : undefined;

  const response = {
    success: false,
    statusCode,
    message,
    ...(normalizedErrors && { errors: normalizedErrors }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
