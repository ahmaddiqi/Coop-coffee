import axios from 'axios';
import { dbManager } from '@/utils/indexedDB';
import type { OfflineSubmission } from '@/utils/indexedDB';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    console.log('Axios request interceptor:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - simplified for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Axios response interceptor - SUCCESS:', {
      status: response.status,
      method: response.config.method,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details for debugging
    console.error('Axios response interceptor - ERROR:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: originalRequest?.url,
      method: originalRequest?.method,
      headers: originalRequest?.headers,
      data: originalRequest?.data
    });
    
    // Temporarily disable offline handling to debug main issue
    return Promise.reject(error);
  }
);

export default api;
