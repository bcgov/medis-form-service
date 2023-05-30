const routes = require('express').Router();
const controller = require('./controller');
const Redis = require('ioredis');

routes.use('/reminder', (req, res, next) => {
  // eslint-disable-next-line no-empty
  try {
    if (req.method == 'GET') {
      const apikeyEnv = process.env.APITOKEN;
      const apikeyIncome = req.headers.apikey;
      if (apikeyEnv == apikeyIncome && (apikeyIncome == undefined || apikeyIncome == '')) return res.status(401).json({ message: 'No API key provided' });
      if (apikeyIncome === apikeyEnv) {
        next();
      } else {
        return res.status(401).json({ message: 'Invalid API key' });
      }
    } else {
      return res.status(404).json({ message: 'Only GET request is accepted' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

routes.get('/reminder', async (req, res, next) => {
  await controller.sendReminderToSubmitter(req, res, next);
});

routes.use('/multiSubmission/**', async (req, res, next) => {
  // eslint-disable-next-line no-empty
  try {
    if (req.method == 'POST') {
      const redis = new Redis();
      const token = req.body.token;
      const token_key = req.body.token_key;
      const old_token = await redis.get(token_key);
      if (token == old_token && (token == undefined || token == '')) {
        redis.quit();
        return res.status(401).json({ message: 'No Token key provided' });
      }
      if (token === old_token) {
        redis.quit();
        next();
      } else {
        redis.quit();
        return res.status(401).json({ message: 'Invalid Token' });
      }
    } else {
      return res.status(404).json({ message: 'Only POST request is accepted' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

routes.post('/multiSubmission/success', async (req, res, next) => {
  await controller.multiSubmissionSuccess(req, res, next);
});

routes.post('/multiSubmission/failed', async (req, res, next) => {
  await controller.multiSubmissionFailed(req, res, next);
});

routes.post('/multiSubmission/crash', async (req, res, next) => {
  await controller.multiSubmissionCrash(req, res, next);
});

module.exports = routes;
