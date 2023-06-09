const axios = require('axios');
const service = {
  init: (data, observer) => {
    const payload = {
      results: data.successData.concat(data.errorData),
      token: data.token,
      token_key: data.token_key,
      formVersionId: data.formVersionId,
      currentUser: data.currentUser,
      draft: true,
      validationResults: data.validationResults,
    };
    if (data.error) {
      observer.next('Validation failed ');
      service.failed(payload, data.url);
    } else {
      observer.next('Validation success ');
      service.success(payload, data.url);
    }
  },
  success: (data, url) => {
    try {
      service.appAxios(60000).post(`${url}/multiSubmission/success`, data);
    } catch (error) {
      service.crash({ message: error }, url);
    }
  },
  failed: (data, url) => {
    try {
      service.appAxios(60000).post(`${url}/multiSubmission/failed`, data);
    } catch (error) {
      service.crash({ message: error }, url);
    }
  },
  crash: (data, url) => {
    try {
      service.appAxios(60000).post(`${url}/multiSubmission/crash`, data);
    } catch (error) {
      // console.log(error);
    }
  },

  /**
   * @function appAxios
   * Returns an Axios instance with auth header and preconfiguration
   * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
   * @returns {object} An axios instance
   */
  appAxios: (timeout = 10000) => {
    const axiosOptions = { timeout: timeout };
    // axiosOptions.baseURL = baseURL;
    const instance = axios.create(axiosOptions);
    // instance.interceptors.request.use();
    return instance;
  },
};
module.exports = service;
