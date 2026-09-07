module.exports = {
  apps: [
    {
      name: 'psc-backend',
      script: 'dist/index.js',
      cwd: '/home/maker/Pilah-Sampah-Cerdas-new/apps/api',
      instances: 2, // Set to 2 instances max for balanced CPU & RAM on budget VPS (replaces 4 instances)
      exec_mode: 'cluster',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        REDIS_URL: 'redis://127.0.0.1:6379'
      },
      max_memory_restart: '1G', // Auto-restart worker smoothly if memory exceeds 1GB
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ]
};
