const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ApiError } = require('../utils');
const { ROLES } = require('../constants');

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with password excluded
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid access token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Usage: authorizeRoles('admin', 'analyst')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Require role: ${roles.join(' or ')}. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

/**
 * Self-authorization check - allows users to access only their own resources
 * (except admins who can access any)
 */
const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const requestedUserId = req.params.id || req.params.userId;
  const isOwnResource = String(req.user._id) === String(requestedUserId);
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isOwnResource && !isAdmin) {
    return next(
      new ApiError(403, 'You can only access your own resources')
    );
  }

  next();
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorizeSelfOrAdmin,
};
