const Joi = require('joi');
const { RECORD_TYPES } = require('../constants');

/**
 * Joi schemas for FinancialRecord-related request validation.
 */

const createRecordSchema = Joi.object({
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount cannot be negative',
    'any.required': 'Amount is required',
  }),
  type: Joi.string()
    .valid(...Object.values(RECORD_TYPES))
    .required()
    .messages({
      'any.only': 'Type must be either "income" or "expense"',
      'any.required': 'Type is required',
    }),
  category: Joi.string().trim().max(50).required().messages({
    'string.empty': 'Category is required',
    'string.max': 'Category cannot exceed 50 characters',
  }),
  date: Joi.date().iso().optional().messages({
    'date.format': 'Date must be in ISO 8601 format',
  }),
  notes: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': 'Notes cannot exceed 500 characters',
  }),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().min(0).optional(),
  type: Joi.string()
    .valid(...Object.values(RECORD_TYPES))
    .optional(),
  category: Joi.string().trim().max(50).optional(),
  date: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(500).allow('').optional(),
}).min(1); // At least one field must be provided for update

const recordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string()
    .valid(...Object.values(RECORD_TYPES))
    .optional(),
  category: Joi.string().trim().optional(),
  userId: Joi.string().optional().messages({
    'string.base': 'userId must be a string',
  }),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  search: Joi.string().trim().optional(),
  sortBy: Joi.string().valid('date', 'amount', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema,
};
