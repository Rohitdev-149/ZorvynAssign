const mongoose = require('mongoose');
const { RECORD_TYPES } = require('../constants');

const financialRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    type: {
      type: String,
      enum: {
        values: Object.values(RECORD_TYPES),
        message: '{VALUE} is not a valid record type. Use "income" or "expense".',
      },
      required: [true, 'Record type is required'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },

    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },

    // Soft-delete flag
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound indexes for common query patterns ──────────────────────────
financialRecordSchema.index({ userId: 1, date: -1 });
financialRecordSchema.index({ userId: 1, type: 1 });
financialRecordSchema.index({ userId: 1, category: 1 });
financialRecordSchema.index({ userId: 1, isDeleted: 1 });

// ── Default query scope: exclude soft-deleted records ───────────────────
financialRecordSchema.pre(/^find/, function (next) {
  // Allow explicitly querying deleted records by passing { isDeleted: true }
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

module.exports = FinancialRecord;
