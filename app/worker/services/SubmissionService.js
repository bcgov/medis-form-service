const axios = require('axios');
const service = {
  init: (data, url) => {
    const payload = { results: data.successData, token: data.token, token_key: data.token_key, formVersionId: data.formVersionId, currentUser: data.currentUser, draft: true };
    if (data.error) {
      service.failed(payload, url);
    } else {
      service.success(payload, url);
    }
  },
  success: (data, url) => {
    try {
      service.appAxios(60).post(`${url}/multiSubmission/success`, data);
    } catch (error) {
      service.crash({ message: error }, url);
    }
  },
  failed: (data, url) => {
    service.appAxios(30).post(`${url}/multiSubmission/failed`, data);
  },
  crash: (data, url) => {
    try {
      service.appAxios().post(`${url}/multiSubmission/crash`, data);
    } catch (error) {
      console.log(error);
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
