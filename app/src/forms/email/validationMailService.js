const emailService = require('./emailService');
const { EmailTypes } = require('../common/constants');
const log = require('../../components/log')(module.filename);
const json2csv = require('json2csv').parse;
const service = {
  _init: async (form, user, typeMail, obj) => {
    let att = null;
    // eslint-disable-next-line no-undef
    if (typeMail != EmailTypes.MULTI_SUB_SUCCESS && typeMail != EmailTypes.MULTI_SUB_REGISTER) {
      const content = service.createCsvContent(obj.json);
      att = service.createAttachement(obj.multiSubmissionId, content);
    }
    //  console.log(form, user, typeMail, obj, att);
    try {
      emailService.initValidationMail(form, user, typeMail, obj, att);
    } catch (error) {
      log.error(error.message, {
        function: '_init',
      });
    }
  },
  createAttachement(id, content) {
    return {
      content: content,
      contentType: 'string',
      encoding: 'base64',
      filename: `validation_results_${id}.csv`,
    };
  },
  async createCsvContent(response) {
    let newResponse = [];
    await response.forEach((item, index) => {
      if (item != null && item != undefined) {
        item.details.forEach((obj) => {
          let error = {};
          if (obj.context != undefined) {
            error = Object({
              ' submission': index,
              ' key': obj.context.key,
              ' label': obj.context.label,
              ' validator': obj.context.validator,
              error_message: obj.message,
            });
          } else {
            error = Object({
              ' submission': index,
              ' key': null,
              ' label': null,
              ' validator': null,
              error_message: obj.message,
            });
          }
          newResponse.push(error);
        });
      }
    });
    const csvData = json2csv(newResponse);
    console.log(csvData);
    return csvData;
  },
};
module.exports = service;
