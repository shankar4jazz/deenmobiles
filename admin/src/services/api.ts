import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

// Professional API configuration with environment detection
const getApiUrl = () => {
  // Priority: Environment variable > Window location > Default
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use same origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // Development default
  return 'http://localhost:3000';
};

const API_URL = getApiUrl();
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 Admin API Configuration:', {
    API_URL,
    API_VERSION,
    BASE_URL: `${API_URL}/api/${API_VERSION}`,
    ENV: import.meta.env.MODE,
  });
}

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const user = useAuthStore.getState().user;

    // Log outgoing request details
    console.log('🚀 [API Request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
      data: config.data,
      hasAuth: !!user?.accessToken,
    });

    if (user?.accessToken) {
      config.headers.Authorization = `Bearer ${user.accessToken}`;
    } else {
      console.warn('⚠️ [API Request] No access token found in auth store');
    }

    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ [API Response]', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      dataType: typeof response.data,
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : null,
      dataSize: JSON.stringify(response.data).length,
    });

    // Log data summary if it's an array or has common pagination properties
    if (response.data) {
      if (Array.isArray(response.data)) {
        console.log(`📊 [API Response] Array with ${response.data.length} items`);
      } else if (response.data.data) {
        console.log('📊 [API Response] Data property:', response.data.data);
      }
      if (response.data.pagination) {
        console.log('📄 [API Response] Pagination:', response.data.pagination);
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Log error details
    console.error('❌ [API Response Error]', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      responseData: error.response?.data,
    });

    // Handle 401 errors (token expired)
    // Prevent infinite retry loop by checking if we've already tried to refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      console.warn('🔄 [API] Attempting token refresh due to 401 error');
      originalRequest._retry = true;
      const user = useAuthStore.getState().user;

      if (user?.refreshToken) {
        try {
          // Attempt to refresh token
          console.log('🔄 [API] Refreshing access token...');
          const response = await axios.post(`${API_URL}/api/${API_VERSION}/auth/refresh`, {
            refreshToken: user.refreshToken,
          });

          const { accessToken } = response.data.data;
          console.log('✅ [API] Token refreshed successfully');

          // Update user with new access token
          useAuthStore.getState().setUser({ ...user, accessToken });

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          console.log('🔄 [API] Retrying original request with new token');
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          console.error('❌ [API] Token refresh failed, logging out user', refreshError);
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, logout user
        console.warn('⚠️ [API] No refresh token available, logging out user');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
