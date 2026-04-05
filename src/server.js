require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

const gracefulShutdown = (signal, exitCode = 0) => {
  console.log(`\n${signal} received. Closing server gracefully...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  if (!server) {
    closeDatabase()
      .then(() => {
        clearTimeout(forceShutdownTimer);
        process.exit(exitCode);
      })
      .catch((error) => {
        clearTimeout(forceShutdownTimer);
        console.error('Error during database shutdown:', error);
        process.exit(1);
      });
    return;
  }

  server.close(async (err) => {
    if (err) {
      clearTimeout(forceShutdownTimer);
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('Server closed');

    try {
      await closeDatabase();
      clearTimeout(forceShutdownTimer);
      process.exit(exitCode);
    } catch (error) {
      clearTimeout(forceShutdownTimer);
      console.error('Error during database shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException', 1);
});

startServer();
