const { User, FinancialRecord } = require('../models');
const { ApiResponse, ApiError } = require('../utils');
const {
  assignRoleSchema,
  updateStatusSchema,
  userListQuerySchema,
} = require('../validators');

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { error } = userListQuerySchema.validate(req.query);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { page = 1, limit = 10, status, role, search } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (role) query.role = role;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitVal = parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limitVal),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitVal);
    const hasNext = parseInt(page) < totalPages;

    res.status(200).json(
      new ApiResponse(200, {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext,
        },
      }, 'Users retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Get record count
    const recordCount = await FinancialRecord.countDocuments({
      userId: id,
      isDeleted: false,
    });

    res.status(200).json(
      new ApiResponse(200, {
        user,
        stats: { recordCount },
      }, 'User retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role to user (admin only)
 */
const assignRole = async (req, res, next) => {
  try {
    const { error } = assignRoleSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent self-demotion from admin
    if (String(req.user._id) === String(id) && user.role === 'admin' && role !== 'admin') {
      throw new ApiError(403, 'Cannot change your own admin role');
    }

    user.role = role;
    await user.save();

    res.status(200).json(
      new ApiResponse(200, { user }, 'Role assigned successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (activate/deactivate)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { error } = updateStatusSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, 'Validation failed', error.details);
    }

    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent self-deactivation
    if (String(req.user._id) === String(id) && user.status === 'active' && status === 'inactive') {
      throw new ApiError(403, 'Cannot deactivate your own account');
    }

    user.status = status;
    await user.save();

    res.status(200).json(
      new ApiResponse(200, { user }, 'User status updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete - deactivate only, admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent self-deletion
    if (String(req.user._id) === String(id)) {
      throw new ApiError(403, 'Cannot delete your own account');
    }

    // Soft delete: set status to inactive and mark as deleted
    user.status = 'inactive';
    await user.save();

    res.status(200).json(
      new ApiResponse(200, null, 'User deactivated successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  assignRole,
  updateStatus,
  deleteUser,
};
