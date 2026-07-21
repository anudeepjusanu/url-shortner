const app = require("./app");
const connectDB = require("./config/database");
const ScheduledTasks = require("./services/scheduledTasks");
const amplitudeService = require("./services/amplitudeService");
const mongoose = require("mongoose");
const logger = require("./config/logger");
require("dotenv").config();

// Initialize Amplitude Analytics
amplitudeService.initialize();

// Seed default plans once the DB connection is open
mongoose.connection.once("open", async () => {
  try {
    const { seedPlans } = require("./scripts/init-plans");
    await seedPlans();
  } catch (err) {
    logger.error("⚠️  Plan auto-seed error:", err.message);
  }
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

const server = app.listen(PORT, HOST, () => {
  logger.info(`Server running on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Health check: http://${HOST}:${PORT}/health`);

  // Initialize scheduled tasks (payment reminders, trial notifications, etc.)
  if (process.env.NODE_ENV !== "test") {
    ScheduledTasks.initializeCronJobs();
  }
});

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error("Error during server shutdown:", err);
      process.exit(1);
    }

    logger.info("Server closed successfully");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Shutdown timeout reached. Force closing...");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("Unhandled Rejection");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("Uncaught Exception");
});

module.exports = server;
