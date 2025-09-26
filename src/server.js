const app = require('./app');
const connectDB = require('./config/database');
require('dotenv').config();

// Connect to database
connectDB();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'locahost';

const server = app.listen(PORT, HOST, () => {
  console.log(`=� Server running on ${HOST}:${PORT}`);
  console.log(`<
 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=� Health check: http://${HOST}:${PORT}/health`);
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