require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { getDatabaseStatus } = require('./config/db');
const { createRateLimiter, errorHandler } = require('./middlewares');

// Import route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const recordRoutes = require('./routes/record.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Initialize Express app
const app = express();

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet()); // Sets various HTTP headers for security

// ── CORS Middleware ────────────────────────────────────────────────────────
const configuredOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = configuredOrigins.includes('*');

const corsOptions = {
  origin: allowAllOrigins ? '*' : configuredOrigins,
  credentials: !allowAllOrigins,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ── Logging Middleware ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger
}

// ── Rate Limiting Middleware ────────────────────────────────────────────────
const apiLimiter = createRateLimiter();
app.use('/api/', apiLimiter);

// ── Body Parsing Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// ── API Documentation (Swagger) ─────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/records`, recordRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// ── Health Check Endpoint ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const database = {
    status: getDatabaseStatus(),
  };
  const isHealthy = database.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    statusCode: isHealthy ? 200 : 503,
    message: isHealthy
      ? 'Server is healthy'
      : 'Server is running but database is unavailable',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database,
  });
});

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl || req.url} not found`,
  });
});

app.use(errorHandler);

module.exports = app;
