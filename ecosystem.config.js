module.exports = {
  apps: [
    {
      name: 'signal-server',
      script: 'app/bin/signal-server',
      node_args: '-r esm',

      env: {
        NODE_ENV: 'development',
        PORT: 3913,
        LOG_LEVEL: 'trace'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3903,
        LOG_LEVEL: 'trace'
      }
    }
  ]
}
