module.exports = {
  apps: [
    {
      name: 'bsospace-github-stats-v3',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3004',
      exec_mode: 'cluster',
      instances: 'max',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
