module.exports = {
  apps: [
    {
      name: 'url-shortener',
      script: 'src/server.js',
      instances: 1, // or 'max' for cluster mode
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3015
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3015
      },
      // Restart the app if it crashes
      autorestart: true,
      // Watch for file changes (disable in production)
      watch: false,
      // Maximum memory before restart
      max_memory_restart: '1G',
      // Logging
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart delay
      restart_delay: 4000,
      // Environment variables
      env_file: '.env'
    }
  ]
};