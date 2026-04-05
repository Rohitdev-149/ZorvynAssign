const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ROLES } = require('../constants');
const { ApiResponse, ApiError } = require('../utils');
const { registerSchema, loginSchema } = require('../validators');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    if (role && role !== ROLES.VIEWER) {
      throw new ApiError(403, 'Self-registration is limited to the viewer role');
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.VIEWER,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json(
      new ApiResponse(201, { user, token }, 'User registered successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user without password
    res.status(200).json(
      new ApiResponse(200, { user, token }, 'Login successful')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { user }, 'Profile retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
