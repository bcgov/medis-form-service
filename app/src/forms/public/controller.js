const service = require('./service');
module.exports = {
  sendReminderToSubmitter: async (req, res, next) => {
    try {
      const response = await service.sendReminderToSubmitter();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  multiSubmissionSuccess: async (req, res, next) => {
    try {
      const response = await service.multiSubmissionSuccess(req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  multiSubmissionFailed: async (req, res, next) => {
    try {
      const response = await service.multiSubmissionFailed(req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  multiSubmissionCrash: async (req, res, next) => {
    try {
      const response = await service.multiSubmissionCrash(req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
