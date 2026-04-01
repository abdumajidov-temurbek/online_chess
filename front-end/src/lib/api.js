import axios from 'axios';

const configuredApiUrl = process.env.REACT_APP_API_URL || '';
const normalizedApiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
