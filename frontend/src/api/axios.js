import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedBaseURL = configuredBaseURL.replace(/\/+$/, '').endsWith('/api')
  ? configuredBaseURL.replace(/\/+$/, '')
  : `${configuredBaseURL.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: normalizedBaseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
