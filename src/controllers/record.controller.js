const { FinancialRecord, User } = require('../models');
const { ApiResponse, ApiError } = require('../utils');
const {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema,
} = require('../validators');
const { ROLES } = require('../constants');

/**
 * Build query based on user role
 * Admins can query all records or filter by userId if provided
 * Non-admins can only access their own records
 */
const buildRecordQuery = (user, queryParams = {}) => {
  const baseQuery = { isDeleted: false };

  // Admin can see all records, but can also filter by userId if specified
  if (user.role === ROLES.ADMIN) {
    // If admin provides a userId filter, apply it; otherwise show all
    if (queryParams.userId) {
      baseQuery.userId = queryParams.userId;
    }
    return baseQuery;
  }

  // Non-admins can only see their own records
  baseQuery.userId = user._id;
  return baseQuery;
};

/**
 * Create a new financial record
 */
const createRecord = async (req, res, next) => {
  try {
    const { error } = createRecordSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { amount, type, category, date, notes } = req.body;

    // Ensure date is valid or default to now
    const recordDate = date ? new Date(date) : new Date();

    const record = await FinancialRecord.create({
      userId: req.user._id,
      amount,
      type,
      category,
      date: recordDate,
      notes: notes || '',
    });

    res.status(201).json(
      new ApiResponse(201, { record }, 'Record created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all records with filters (pagination, search, date range)
 */
const getAllRecords = async (req, res, next) => {
  try {
    const { error } = recordQuerySchema.validate(req.query);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      userId, // Admin can optionally filter by userId
    } = req.query;

    // Build query based on user role
    const query = buildRecordQuery(req.user, { userId });

    // Apply additional filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Also sort by createdAt as secondary sort
    if (sortBy !== 'createdAt') {
      sort.createdAt = -1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      FinancialRecord.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      FinancialRecord.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;

    res.status(200).json(
      new ApiResponse(200, {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext,
        },
      }, 'Records retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get single record by ID
 */
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build query: admins can access any record, others only their own
    const query = { _id: id, isDeleted: false };
    if (req.user.role !== ROLES.ADMIN) {
      query.userId = req.user._id;
    }

    const record = await FinancialRecord.findOne(query);

    if (!record) {
      throw new ApiError(404, 'Record not found');
    }

    res.status(200).json(
      new ApiResponse(200, { record }, 'Record retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update record
 */
const updateRecord = async (req, res, next) => {
  try {
    const { error } = updateRecordSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { id } = req.params;

    // Build query: admins can access any record, others only their own
    const query = { _id: id, isDeleted: false };
    if (req.user.role !== ROLES.ADMIN) {
      query.userId = req.user._id;
    }

    const record = await FinancialRecord.findOne(query);

    if (!record) {
      throw new ApiError(404, 'Record not found');
    }

    // Update fields
    const updateFields = { ...req.body };
    if (updateFields.date) {
      updateFields.date = new Date(updateFields.date);
    }

    Object.assign(record, updateFields);
    await record.save();

    res.status(200).json(
      new ApiResponse(200, { record }, 'Record updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete record (soft delete)
 */
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build query: admins can access any record, others only their own
    const query = { _id: id, isDeleted: false };
    if (req.user.role !== ROLES.ADMIN) {
      query.userId = req.user._id;
    }

    const record = await FinancialRecord.findOne(query);

    if (!record) {
      throw new ApiError(404, 'Record not found');
    }

    // Soft delete
    record.isDeleted = true;
    await record.save();

    res.status(200).json(
      new ApiResponse(200, null, 'Record deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
