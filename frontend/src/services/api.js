import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

function isValidApiPayload(response) {
  if (response.status === 304) return false;
  const data = response.data;
  return data != null && data !== '' && typeof data === 'object' && data.success !== undefined;
}

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.params = { ...config.params, _t: Date.now() };
  return config;
});

api.interceptors.response.use(
  async (response) => {
    if (isValidApiPayload(response)) {
      return response;
    }
    if (!response.config._retriedEmptyBody) {
      response.config._retriedEmptyBody = true;
      return api.request(response.config);
    }
    return Promise.reject(new Error('Empty API response (browser cache). Hard refresh the page.'));
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isAuthRoute = originalRequest.url?.includes('/auth/login')
      || originalRequest.url?.includes('/auth/register')
      || originalRequest.url?.includes('/auth/google')
      || originalRequest.url?.includes('/auth/refresh');

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearAuthStorage();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, user } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorage();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
