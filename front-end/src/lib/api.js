import axios from 'axios';

import { clearAuthStorage, getAccessToken } from './authStorage';
import { getGuestSessionId, isGuestModeEnabled } from './guestStorage';

const configuredApiUrl = process.env.REACT_APP_API_URL || '';
const normalizedApiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!token && isGuestModeEnabled()) {
    const guestSessionId = getGuestSessionId();
    if (guestSessionId) {
      config.headers['X-Guest-Session'] = guestSessionId;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = typeof error.config?.url === 'string' && error.config.url.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRequest && getAccessToken()) {
      clearAuthStorage();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
