const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares');

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard summary with all financial statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: number
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totals:
 *                       type: object
 *                       properties:
 *                         income:
 *                           type: number
 *                         expense:
 *                           type: number
 *                         netBalance:
 *                           type: number
 *                         incomeCount:
 *                           type: integer
 *                         expenseCount:
 *                           type: integer
 *                     categoryWise:
 *                       type: object
 *                       properties:
 *                         income:
 *                           type: array
 *                         expense:
 *                           type: array
 *                     recentTransactions:
 *                       type: array
 *                     monthlySummary:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getDashboard);

module.exports = router;
