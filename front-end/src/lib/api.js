import axios from 'axios';

const configuredApiUrl = process.env.REACT_APP_API_URL || '';
const normalizedApiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/api`
  : '/api';

console.log('API URL:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: normalizedApiBaseUrl,
});

api.interceptors.request.use((config) => {
  const requestUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log(`${(config.method || 'get').toUpperCase()} ${requestUrl}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
