import axios from 'axios';

const apiOrigin = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:5500').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${apiOrigin}/api`,
});

export default api;
