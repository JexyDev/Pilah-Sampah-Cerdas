module.exports = {
  apps: [
    {
      name: 'psc-backend',
      script: 'dist/index.js',
      cwd: '/home/maker/Pilah-Sampah-Cerdas-new/apps/api',
      instances: 2, // Set to 2 instances max for balanced CPU & RAM on budget VPS (replaces 4 instances)
      exec_mode: 'cluster',
      node_args: '--max-old-space-size=384', // Enforce aggressive V8 garbage collection at 384MB to prevent Linux OOM
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        REDIS_URL: 'redis://127.0.0.1:6379'
      },
      max_memory_restart: '350M', // Auto-restart worker smoothly if memory exceeds 350MB
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ]
};
