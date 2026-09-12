const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  retryStrategy(times) {
    // Keep trying to reconnect every 1 to 2 seconds if Docker is booting
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => {
  console.log('⚡ Connected to Redis on 127.0.0.1:6379 successfully');
});

redis.on('ready', () => {
  console.log('🚀 Redis is ready to accept commands');
});

redis.on('error', (err) => {
  console.warn('⚠️ Redis issue:', err.message);
});

module.exports = redis;