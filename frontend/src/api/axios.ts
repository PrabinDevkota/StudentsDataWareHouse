import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define ApiResponse type locally to avoid import issues
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Skip adding auth headers for login endpoints
    const isLoginEndpoint = config.url?.includes('/auth/login') || 
                           config.url?.includes('/auth/student-login') || 
                           config.url?.includes('/auth/faculty-login') ||
                           config.url?.includes('/auth/club-login') ||
                           config.url?.includes('/auth/register');
    
    if (!isLoginEndpoint) {
      // Get token from Zustand store (stored in localStorage as 'auth-storage')
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          const token = authData.state?.accessToken;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const baseURL = apiClient.defaults.baseURL || (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api');

    // Helper: read auth storage
    const readAuth = () => {
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) return null;
      try {
        return JSON.parse(authStorage);
      } catch (e) {
        console.error('Error parsing auth storage:', e);
        return null;
      }
    };

    // Handle missing token: try to attach and retry once
    if (status === 401 && code === 'MISSING_TOKEN' && !originalRequest._retry) {
      originalRequest._retry = true;
      const authData = readAuth();
      const accessToken = authData?.state?.accessToken;
      if (accessToken) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${accessToken}`,
        };
        return apiClient(originalRequest);
      }
    }

    // Handle unauthorized (401) – try refresh using current access token (backend expects access token)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authData = readAuth();
        const accessToken = authData?.state?.accessToken;
        if (accessToken) {
          const response = await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const { access_token } = response.data.data;
          const updatedAuthData = {
            ...authData,
            state: { ...authData.state, accessToken: access_token },
          };
          localStorage.setItem('auth-storage', JSON.stringify(updatedAuthData));
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${access_token}`,
          };
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed: clear auth and redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle invalid/expired token (403 from auth middleware)
    if (status === 403 && code === 'INVALID_TOKEN') {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.get(url, config),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.post(url, data, config),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.put(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.delete(url, config),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.patch(url, data, config),
};

export default apiClient;
