module.exports = {
  apps: [{
    name: 'backend',
    script: 'index.js',
    cwd: '/media/sahin/d4147fc7-b240-4421-b1dc-f48b17a26cac/deploy/bacl',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}; 