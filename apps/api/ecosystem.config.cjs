module.exports = {
  apps: [
    {
      name: 'psc-backend',
      script: 'dist/index.js',
      cwd: '/home/maker/Pilah-Sampah-Cerdas-new/apps/api',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        REDIS_URL: 'redis://127.0.0.1:6379'
      },
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100
    }
  ]
};
