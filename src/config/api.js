import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  admin: `${BASE_URL}/admin`,
  client: BASE_URL
};

// Tạo instance axios với interceptors
const createAxiosInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor - tự động thêm token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request cho debugging (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      }
      
      return config;
    },
    (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[API Request Error]', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor - xử lý response và lỗi
  instance.interceptors.response.use(
    (response) => {
      // Log successful response (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${response.status} - ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      // Log error response (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API Error] ${error.response?.status || 'Network Error'} - ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
      }
      
      // Handle 401 unauthorized - redirect to login
      if (error.response?.status === 401) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[API] Unauthorized - clearing token and redirecting...');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin/login')) {
          if (window.location.pathname.includes('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
      }
      
      // Handle 404 errors
      if (error.response?.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[API] Resource not found:', error.config?.url);
        }
      }
      
      // Handle 500 server errors
      if (error.response?.status >= 500) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[API] Server error:', error.response?.data);
        }
      }
      
      // Network errors
      if (error.code === 'ECONNABORTED') {
        if (process.env.NODE_ENV === 'development') {
          console.error('[API] Request timeout');
        }
      }
      
      if (!error.response) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[API] Network error - backend might be down');
        }
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

export const adminInstance = createAxiosInstance(API_ENDPOINTS.admin);
export const clientInstance = createAxiosInstance(API_ENDPOINTS.client);