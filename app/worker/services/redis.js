const Redis = require('ioredis');

const redis = new Redis({
  port: process.env.REDIS_PORT | 6379,
  host: process.env.REDIS_HOST | 'localhost',
  password: process.env.REDIS_PASSWORD | '',
});

const REDIS_KEY = {
  PRE_SUB: 'pre_submissions',
  FINAL_SUB: 'final_submissions',
};

module.exports = {
  redis,
  REDIS_KEY,
};
