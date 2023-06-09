/* eslint-disable no-unused-vars */
const { redis, REDIS_KEY } = require('./redis');
const validationService = require('./ValidationService');
const SubmissionService = require('./SubmissionService');
const WAIT_TIMES = [10000, 10, 5000];

const service = {
  sleep: (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
  _init: async (observer) => {
    // eslint-disable-next-line no-constant-condition
    // const lpopAsync = promisify(redis.lpop).bind(redis);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pre_submissions = await redis.lpop(REDIS_KEY.PRE_SUB);
      if (pre_submissions == undefined || pre_submissions == '') {
        console.log('No submission found');
        await service.sleep(WAIT_TIMES[0]);
        continue;
      }
      console.log('One submission found ');
      try {
        const data = service.getJson(pre_submissions);
        let schema = await redis.get(data.formVersionId);
        schema = service.getJson(schema);
        if (schema == undefined || schema == '') {
          console.log('No schema form found for those submissions ');
          await service.sleep(WAIT_TIMES[0]);
          continue;
        }
        if (!data) continue;
        console.log('Submission ready to validate ');
        observer.next({ data, schema });
        await service.sleep(WAIT_TIMES[0]);
        continue;
      } catch (e) {
        await service.sleep(WAIT_TIMES[0]);
        continue;
      }
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
  validate: async (obj, schema, observer) => {
    try {
      const submissions = obj.data.submission.data;
      let validationResults = [];
      let successData = [];
      let errorData = [];
      let index = 0;
      let error = false;
      console.log('Validation start');
      await Promise.all(
        submissions.map(async (singleData) => {
          const report = await validationService.validate(singleData, schema);
          console.log(report);
          if (report !== null) {
            validationResults[index] = report;
            errorData[index] = singleData;
            index++;
            error = true;
            console.log('One Submission failed found ');
          } else {
            successData.push(singleData);
          }
        })
      );
      console.log('Validation over');
      let info = {
        formVersionId: obj.formVersionId,
        currentUser: obj.currentUser,
        successData,
        errorData,
        validationResults,
        error,
        token: obj.token,
        token_key: obj.token_key,
        url: obj.url,
      };
      console.log('Store validation results to redis');
      await redis.rpush(REDIS_KEY.FINAL_SUB, JSON.stringify(info));
      observer.next();
      //await observer.next(info);
      observer.complete();
    } catch (err) {
      service.crash(obj.url, err);
    }
  },
  populate: async (observer) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await service.sleep(WAIT_TIMES[2]);
      try {
        let submission = await redis.lpop(REDIS_KEY.FINAL_SUB);
        if (submission == undefined) {
          console.log('No Resolve submission found');
          continue;
        }
        console.log('One Resolve submission found #');
        submission = service.getJson(submission);
        SubmissionService.init(submission, observer);
        await service.sleep(WAIT_TIMES[2]);
      } catch (err) {
        console.log(err);
        continue;
      }
    }
  },
  crash: (url, data) => {
    setTimeout(async () => {
      SubmissionService.crash(data, url);
    }, WAIT_TIMES[1]);
  },
};
module.exports = service;
