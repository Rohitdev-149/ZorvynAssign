const Joi = require('joi');
const { ALL_ROLES, USER_STATUS } = require('../constants');

/**
 * Joi schemas for User-related request validation.
 */

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required',
  }),
  role: Joi.string()
    .valid(...ALL_ROLES)
    .optional()
    .messages({
      'any.only': `Role must be one of: ${ALL_ROLES.join(', ')}`,
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const assignRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...ALL_ROLES)
    .required()
    .messages({
      'any.only': `Role must be one of: ${ALL_ROLES.join(', ')}`,
      'string.empty': 'Role is required',
    }),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .required()
    .messages({
      'any.only': `Status must be one of: ${Object.values(USER_STATUS).join(', ')}`,
      'string.empty': 'Status is required',
    }),
});

const userListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .optional(),
  role: Joi.string()
    .valid(...ALL_ROLES)
    .optional(),
  search: Joi.string().trim().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  assignRoleSchema,
  updateStatusSchema,
  userListQuerySchema,
};
