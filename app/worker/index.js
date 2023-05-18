const indexService = require('./services/IndexService');
// const redis = indexService.redisConnection();
// redis.on('error', indexService.redisErrorOnConnection);
indexService._init();
