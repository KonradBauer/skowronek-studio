module.exports = {
  apps: [
    {
      name: 'skowronek-studio',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 1000',
      cwd: '/var/www/skowronek-studio',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
      // Auto-restart
      max_restarts: 10,
      restart_delay: 5000,
      // Logs
      error_file: '/var/www/skowronek-studio/logs/error.log',
      out_file: '/var/www/skowronek-studio/logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
