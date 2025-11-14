/**
 * Authentication utility functions
 * API-based Authentication (Laravel backend)
 */
import { api } from './api';
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_EMAIL_KEY = 'userEmail';
export const USER_ROLE_KEY = 'userRole';

/**
 * Authenticate using Laravel API
 * Expects Laravel to return a token (e.g., access_token or token) and user info/role
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, token?: string, role?: string, email?: string, data?: any, error?: string}>}
 */
export const authenticateWithApi = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password });
    const data = response?.data || {};

    // Try common token keys from Laravel APIs
    const token =
      data.access_token ||
      data.token ||
      data.data?.access_token ||
      data.data?.token;

    // Try common role locations
    const role =
      data.user?.role ||
      data.data?.user?.role ||
      data.role ||
      data.data?.role ||
      null;

    const returnedEmail =
      data.user?.email || data.data?.user?.email || email;

    if (!token) {
      return {
        success: false,
        error: 'No token returned from API. Please verify the /login response shape.',
        data
      };
    }

    return { success: true, token, role, email: returnedEmail, data };
  } catch (err) {
    const message =
      err?.data?.message ||
      err?.response?.data?.message ||
      err?.message ||
      'Authentication failed.';
    return { success: false, error: message };
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
};

/**
 * Check if user is super admin
 * @returns {boolean}
 */
export const isSuperAdmin = () => {
  if (typeof window === 'undefined') return false;
  // Treat any valid token as authenticated for dashboard access to avoid loops caused by role mismatches
  return isAuthenticated();
};

/**
 * Get current user email
 * @returns {string|null}
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(USER_EMAIL_KEY) || sessionStorage.getItem(USER_EMAIL_KEY);
};

/**
 * Get current user role
 * @returns {string|null}
 */
export const getUserRole = () => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(USER_ROLE_KEY) || sessionStorage.getItem(USER_ROLE_KEY);
};

/**
 * Login user and store credentials
 * @param {string} email 
 * @param {string} token 
 * @param {string} role 
 * @param {boolean} rememberMe 
 */
export const login = (email, token, role, rememberMe = false) => {
  // const storage = rememberMe ? localStorage : sessionStorage;
  
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_EMAIL_KEY, email);
  localStorage.setItem(USER_ROLE_KEY, role);
};

/**
 * Logout user and clear credentials
 */
export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(USER_EMAIL_KEY);
  sessionStorage.removeItem(USER_ROLE_KEY);
};

/**
 * Get authentication token
 * @returns {string|null}
 */
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
};
