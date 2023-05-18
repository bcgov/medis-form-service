import axios from 'axios';

/**
 * @function appAxios
 * Returns an Axios instance with auth header and preconfiguration
 * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function appAxios(timeout = 10000, baseURL) {
  const axiosOptions = { timeout: timeout };
  axiosOptions.baseURL = baseURL;
  const instance = axios.create(axiosOptions);
  // instance.interceptors.request.use();
  return instance;
}
