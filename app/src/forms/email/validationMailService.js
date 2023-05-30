const emailService = require('./emailService');

const service = {
  _init: async (form, user, typeMail, obj) => {
    emailService.initValidationMail(form, user, typeMail, obj);
  },
};
module.exports = service;
