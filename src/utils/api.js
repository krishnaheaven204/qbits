'use client';

import axios from 'axios';
import { getAuthToken } from './auth';

// Export base URL from env (no trailing slash). Backend should be set in .env.local
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create a reusable Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  // You can tune timeouts as needed
  timeout: 20000
});

// Request interceptor: inject Bearer token from storage when available
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Only attempt to read storage in the browser
      if (typeof window !== 'undefined') {
        const token = getAuthToken();
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // Non-blocking; log for visibility
      // eslint-disable-next-line no-console
      console.warn('Auth token injection failed:', e);
    }
    // eslint-disable-next-line no-console
    console.debug('[API REQUEST]', {
      method: config.method,
      url: `${config.baseURL}${config.url}`,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor: centralized success/error logging and normalization
apiClient.interceptors.response.use(
  (response) => {
    // eslint-disable-next-line no-console
    console.debug('[API RESPONSE]', {
      status: response.status,
      url: response.config?.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Build a normalized error payload
    const status = error.response?.status;
    const data = error.response?.data;
    const code = error.code;
    const hasResponse = Boolean(error.response);
    const message =
      data?.message ||
      error.message ||
      'An unexpected error occurred while contacting the API.';

    // eslint-disable-next-line no-console
    console.error('[API RESPONSE ERROR]', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status,
      data,
      code,
      hasResponse,
      message
    });

    // Optionally, handle 401 globally (e.g., redirect to login)
    // if (status === 401 && typeof window !== 'undefined') {
    //   window.location.href = '/login';
    // }

    return Promise.reject(
      Object.assign(new Error(message), { status, data, original: error })
    );
  }
);

// Convenience helpers for common verbs
export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, body, config) => apiClient.post(url, body, config),
  put: (url, body, config) => apiClient.put(url, body, config),
  patch: (url, body, config) => apiClient.patch(url, body, config),
  delete: (url, config) => apiClient.delete(url, config)
};

export default apiClient;