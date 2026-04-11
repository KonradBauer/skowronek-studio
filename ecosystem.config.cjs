// PM2 ecosystem config — Skowronek Studio
// Deploy: pm2 start ecosystem.config.cjs
// Reload:  pm2 reload skowronekstudio --update-env

module.exports = {
  apps: [
    {
      name: 'skowronekstudio',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/skowronekstudio',
      instances: 1,
      // NODE_ENV=development — Payload pushuje schemat bazy przy starcie
      // Zmienić na production po wygenerowaniu plików migracji
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      node_args: '--max-old-space-size=4096',
      max_memory_restart: '3500M',
      // Wykładniczy backoff przy crashach (100ms → max 16s)
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
    },
  ],
}
