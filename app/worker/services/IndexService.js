/* eslint-disable no-unused-vars */
const Redis = require('ioredis');
const validationService = require('./ValidationService');
const SubmissionService = require('./SubmissionService');

const REDIS_KEY = {
  PRE_SUB: 'pre_submissions',
  FINAL_SUB: 'final_submissions',
};

const service = {
  sleep: (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
  _init: async () => {
    // eslint-disable-next-line no-constant-condition
    // const lpopAsync = promisify(redis.lpop).bind(redis);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const redis = new Redis();
      const pre_submissions = await redis.lpop(REDIS_KEY.PRE_SUB);
      if (pre_submissions == undefined || pre_submissions == '') {
        console.log('No submission found');
        await service.sleep(10000);
        continue;
      }
      try {
        const data = service.getJson(pre_submissions);
        let schema = await redis.get(data.formVersionId);
        schema = service.getJson(schema);
        if (schema == undefined || schema == '') {
          console.log('No schema form found for those submissions ');
          await service.sleep(10000);
          continue;
        }
        if (!data) continue;
        service.validate(data, redis, schema);
      } catch (e) {
        console.log(e);
        await service.sleep(10000);
        service._init();
        continue;
      }
      await service.sleep(10000);
    }
  },
  getJson: (data) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  validate: async (obj, redis, schema) => {
    const submissions = obj.data.submission.data;
    let validationResults = [];
    let successData = [];
    let errorData = [];
    let index = 0;
    let error = false;
    await Promise.all(
      submissions.map(async (singleData) => {
        const report = await validationService.validate(singleData, schema);
        if (report !== null) {
          validationResults[index] = report;
          errorData[index] = singleData;
          index++;
          error = true;
        } else {
          successData.push(singleData);
        }
      })
    );
    let info = {
      formVersionId: obj.formVersionId,
      currentUser: obj.currentUser,
      successData,
      errorData,
      validationResults,
      error,
    };
    service.finalize(info, redis);
  },
  finalize: async (info, redis) => {
    await redis.rpush(REDIS_KEY.FINAL_SUB, JSON.stringify(info));
    service.populate(redis);
  },
  populate: (redis) => {
    setTimeout(async () => {
      let submissions = await redis.lpop(REDIS_KEY.FINAL_SUB);
      submissions = service.getJson(submissions);
      SubmissionService.sendData(submissions);
    }, 30000);
  },
};
module.exports = service;
