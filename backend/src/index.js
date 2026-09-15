const app = require('./app');
const config = require('./config');
const { connectRedis } = require('./config/redis');

async function startServer() {
  await connectRedis();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = app;
