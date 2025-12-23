const cron = require('node-cron');
const { runHealthChecks } = require('../services/linkHealthService');

// Run health checks every 15 minutes
const scheduleHealthChecks = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🏥 Running scheduled health checks...');
    try {
      await runHealthChecks();
    } catch (error) {
      console.error('Error in scheduled health checks:', error);
    }
  });

  console.log('✓ Health monitoring cron job scheduled (every 15 minutes)');
};

module.exports = { scheduleHealthChecks };
