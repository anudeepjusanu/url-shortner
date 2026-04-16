const app = require('./app');
const connectDB = require('./config/database');
const ScheduledTasks = require('./services/scheduledTasks');
const amplitudeService = require('./services/amplitudeService');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize Amplitude Analytics
amplitudeService.initialize();

// Seed default plans once the DB connection is open
mongoose.connection.once('open', async () => {
  try {
    const { seedPlans } = require('./scripts/init-plans');
    await seedPlans();
  } catch (err) {
    console.error('⚠️  Plan auto-seed error:', err.message);
  }
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`=� Server running on ${HOST}:${PORT}`);
  console.log(`<
 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=� Health check: http://${HOST}:${PORT}/health`);

  // Initialize scheduled tasks (payment reminders, trial notifications, etc.)
  if (process.env.NODE_ENV !== 'test') {
    ScheduledTasks.initializeCronJobs();
  }
});

const gracefulShutdown = (signal) => {
  console.log(`\n=� Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('L Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log(' Server closed successfully');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('� Shutdown timeout reached. Force closing...');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('=� Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  console.error('=� Uncaught Exception:', error);
  gracefulShutdown('Uncaught Exception');
});

module.exports = server;