module.exports = {
  apps: [
    {
      name: 'nightclub-ads',
      script: 'node_modules/.bin/next',
      args: 'start -p 8496',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8496,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8496,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
