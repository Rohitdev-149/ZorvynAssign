const mongoose = require('mongoose');

let listenersAttached = false;
let hasConnectedOnce = false;

const getDatabaseStatus = () => {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

const attachConnectionListeners = () => {
  if (listenersAttached) {
    return;
  }

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    if (hasConnectedOnce) {
      console.warn('MongoDB disconnected');
    }
  });

  mongoose.connection.on('reconnected', () => {
    hasConnectedOnce = true;
    console.log('MongoDB reconnected');
  });

  listenersAttached = true;
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  attachConnectionListeners();

  const conn = await mongoose.connect(mongoUri, {
    autoIndex: true,
    family: 4,
    serverSelectionTimeoutMS: 5000,
  });

  hasConnectedOnce = true;
  console.log(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}`);

  return conn;
};

module.exports = {
  connectDB,
  getDatabaseStatus,
};
