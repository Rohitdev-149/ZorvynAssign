const { FinancialRecord } = require('../models');
const { ApiResponse, ApiError } = require('../utils');

/**
 * Get dashboard summary - all financial stats for the authenticated user
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Parallel queries for better performance
    const [
      totals,
      categoryWise,
      recentTransactions,
      monthlySummary,
    ] = await Promise.all([
      // Get total income, expense, and net balance
      getTotals(userId),
      // Get category-wise breakdown
      getCategoryWise(userId),
      // Get recent 5 transactions
      getRecentTransactions(userId),
      // Get monthly summary for last 6 months
      getMonthlySummary(userId),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        totals,
        categoryWise,
        recentTransactions,
        monthlySummary,
      }, 'Dashboard data retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Get total income and expense
 */
const getTotals = async (userId) => {
  const result = await FinancialRecord.aggregate([
    { $match: { userId: userId, isDeleted: false } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totals = {
    income: 0,
    expense: 0,
    netBalance: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  result.forEach((item) => {
    if (item._id === 'income') {
      totals.income = item.total;
      totals.incomeCount = item.count;
    } else if (item._id === 'expense') {
      totals.expense = item.total;
      totals.expenseCount = item.count;
    }
  });

  totals.netBalance = totals.income - totals.expense;

  return totals;
};

/**
 * Helper: Get category-wise totals
 */
const getCategoryWise = async (userId) => {
  const result = await FinancialRecord.aggregate([
    { $match: { userId: userId, isDeleted: false } },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
    {
      $project: {
        type: '$_id.type',
        category: '$_id.category',
        total: 1,
        count: 1,
      },
    },
  ]);

  // Organize by type
  const categoryWise = {
    income: [],
    expense: [],
  };

  result.forEach((item) => {
    if (item.type === 'income') {
      categoryWise.income.push({
        category: item.category,
        total: item.total,
        count: item.count,
      });
    } else {
      categoryWise.expense.push({
        category: item.category,
        total: item.total,
        count: item.count,
      });
    }
  });

  return categoryWise;
};

/**
 * Helper: Get recent transactions (last 5)
 */
const getRecentTransactions = async (userId) => {
  const transactions = await FinancialRecord.find({
    userId,
    isDeleted: false,
  })
    .sort({ date: -1 })
    .limit(5)
    .select('amount type category date notes createdAt');

  return transactions;
};

/**
 * Helper: Get monthly summary for last 6 months
 */
const getMonthlySummary = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        userId: userId,
        isDeleted: false,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        '_id.year': -1,
        '_id.month': -1,
      },
    },
  ]);

  // Organize by year-month
  const monthlySummary = {};

  result.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    if (!monthlySummary[key]) {
      monthlySummary[key] = {
        income: 0,
        expense: 0,
        net: 0,
        incomeCount: 0,
        expenseCount: 0,
      };
    }

    if (item._id.type === 'income') {
      monthlySummary[key].income = item.total;
      monthlySummary[key].incomeCount = item.count;
    } else {
      monthlySummary[key].expense = item.total;
      monthlySummary[key].expenseCount = item.count;
    }

    monthlySummary[key].net =
      monthlySummary[key].income - monthlySummary[key].expense;
  });

  // Convert to sorted array
  return Object.entries(monthlySummary)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => b.month.localeCompare(a.month));
};

module.exports = {
  getDashboard,
};
