import axios from 'axios';
import { clearStoredAuth, getToken } from '@/lib/auth/auth';

// Usa variável de ambiente (pode ser definida em .env) ou cai para '/api' (proxy configurado em vite.config.ts)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  validateStatus: (status) => status < 400,
});

api.interceptors.request.use(
  async (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error?.config?.url as string | undefined;
    const isAuthRoute = requestUrl?.includes('/auth/login') || requestUrl?.includes('/auth/register');

    if (error?.response?.status === 401 && !isAuthRoute) {
      clearStoredAuth();
    }

    return Promise.reject(error);
  }
);