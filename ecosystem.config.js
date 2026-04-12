module.exports = {
  apps: [
    {
      name: 'skowronekstudio',
      // Standalone server — samodzielny Node.js bez potrzeby node_modules w runtime
      script: '.next/standalone/server.js',
      cwd: '/var/www/skowronekstudio',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '3G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    },
  ],
}
