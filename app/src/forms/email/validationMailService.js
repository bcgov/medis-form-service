const emailService = require('./emailService');
const log = require('../../components/log')(module.filename);
const service = {
  _init: async (form, user, typeMail, obj) => {
    console.log(form, user, typeMail, obj);
    try {
      emailService.initValidationMail(form, user, typeMail, obj);
    } catch (error) {
      log.error(error.message, {
        function: '_init',
      });
    }
  },
};
module.exports = service;
