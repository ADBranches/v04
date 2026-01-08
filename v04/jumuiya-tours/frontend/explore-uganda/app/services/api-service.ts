import axios from 'axios';
import { API_BASE_URL } from '../config/app-config';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  [key: string]: any;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  data?: any;
}

interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: any;
}

// Configuration
// let API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
console.log("🌍 API_BASE_URL =", BASE_URL);

// Normalize trailing slash (avoid double or missing slashes)
// if (API_BASE_URL.endsWith('/')) {
//   API_BASE_URL = API_BASE_URL.slice(0, -1);
// }
// console.log("🌍 API_BASE_URL =", API_BASE_URL);

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    
    // Handle both response formats
    if (response.data && typeof response.data === 'object') {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (import.meta.env.MODE === "development") {
      console.groupCollapsed(
        `❌ API Error [${response?.status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`
      );
      console.log("Message:", error.message);
      console.log("Response data:", response?.data);
      console.groupEnd();
    } else {
      // Production: log minimal info without red trace
      console.info(
        `%c⚠️ API ${response?.status || "error"}: ${error.config?.url}`,
        "color: orange"
      );
    }

    // Handle specific error cases
    if (response?.status === 401) {
      console.warn('🔐 Authentication failed, redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('auth_timestamp');
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/auth/')) {
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1000);
      }
    } else if (response?.status === 403) {
      console.warn('🚫 Access forbidden - insufficient permissions');
      showNotification('You do not have permission to perform this action.', 'error');
    } else if (response?.status === 429) {
          console.warn('⏰ Rate limit exceeded — applying back-off');
          const retryAfter = Number(response.headers?.['retry-after']) || 3;

          showNotification(`Too many requests. Retrying in ${retryAfter}s...`, 'warning');

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(api(error.config)); // re-attempt same request once
            }, retryAfter * 1000);
          });
        }
      else if (response?.status >= 500) {
        console.error('🔥 Server error occurred');
        showNotification('Server error. Please try again later.', 'error');
      } else if (!response) {
        console.error('🌐 Network error - server unreachable');
        showNotification('Network error. Please check your connection.', 'error');
      }

      return Promise.reject(error);
    }
  );

// Enhanced API service with fetch-style interface
export const apiService = {
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await api.get(endpoint, {
        params: options.params,
        headers: options.headers,
      });
      
      // Handle both response formats
      const responseData = response.data;
      
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (!responseData.success) {
          throw new Error(responseData.error || 'API request failed');
        }
        return responseData as T;
      }
      
      // If no success field, assume it's successful
      return responseData as T;
    } catch (error) {
      throw enhanceError(error, 'GET', endpoint);
    }
  },

  async post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await api.post(endpoint, body, {
        headers: options.headers,
      });
      
      const responseData = response.data;
      
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (!responseData.success) {
          throw new Error(responseData.error || 'API request failed');
        }
        return responseData as T;
      }
      
      return responseData as T;
    } catch (error) {
      throw enhanceError(error, 'POST', endpoint);
    }
  },

  async put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await api.put(endpoint, body, {
        headers: options.headers,
      });
      
      const responseData = response.data;
      
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (!responseData.success) {
          throw new Error(responseData.error || 'API request failed');
        }
        return responseData as T;
      }
      
      return responseData as T;
    } catch (error) {
      throw enhanceError(error, 'PUT', endpoint);
    }
  },

  async patch<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await api.patch(endpoint, body, {
        headers: options.headers,
      });
      
      const responseData = response.data;
      
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (!responseData.success) {
          throw new Error(responseData.error || 'API request failed');
        }
        return responseData as T;
      }
      
      return responseData as T;
    } catch (error) {
      throw enhanceError(error, 'PATCH', endpoint);
    }
  },

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await api.delete(endpoint, {
        headers: options.headers,
      });
      
      const responseData = response.data;
      
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (!responseData.success) {
          throw new Error(responseData.error || 'API request failed');
        }
        return responseData as T;
      }
      
      return responseData as T;
    } catch (error) {
      throw enhanceError(error, 'DELETE', endpoint);
    }
  }
};

// Axios-style methods for compatibility
export const apiMethods = {
  async get<T = any>(url: string, config = {}): Promise<T> {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'GET', url);
    }
  },

  async post<T = any>(url: string, data = {}, config = {}): Promise<T> {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'POST', url);
    }
  },

  async put<T = any>(url: string, data = {}, config = {}): Promise<T> {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'PUT', url);
    }
  },

  async patch<T = any>(url: string, data = {}, config = {}): Promise<T> {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'PATCH', url);
    }
  },

  async delete<T = any>(url: string, config = {}): Promise<T> {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'DELETE', url);
    }
  }
};

// Health check function
export const checkAPIHealth = async (): Promise<{ 
  status: 'healthy' | 'unhealthy'; 
  data?: any; 
  error?: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  
  try {
    const response = await api.get('/health');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      data: response.data,
      responseTime
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime
    };
  }
};

// Enhanced error handling
function enhanceError(error: any, method: string, url: string): ApiError {
  const { response } = error;
  
  const enhancedError: ApiError = {
    message: error.message,
    status: response?.status,
    data: response?.data,
  };

  // Extract error message from response
  if (response?.data) {
    if (typeof response.data === 'string') {
      enhancedError.message = response.data;
    } else if (response.data.error) {
      enhancedError.message = response.data.error;
    } else if (response.data.message) {
      enhancedError.message = response.data.message;
    }
    
    if (response.data.code) {
      enhancedError.code = response.data.code;
    }
  }

  if (import.meta.env.MODE === "development") {
    console.warn(`🔥 Enhanced Error [${method} ${url}]`, enhancedError);
  }
  return enhancedError;
}

// Helper function to show notifications
function showNotification(message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info') {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') return;

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ${
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'warning' ? 'bg-yellow-500 text-black' :
    type === 'success' ? 'bg-green-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="font-medium">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current hover:opacity-70 text-lg font-bold">
        ×
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Utility functions
export const apiUtils = {
  // Check if API is available
  async isAvailable(): Promise<boolean> {
    try {
      const health = await checkAPIHealth();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  },

  // Get API base URL
  getBaseURL(): string {
    return API_BASE_URL;
  },

  // Set authentication token
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
    // Also set for backward compatibility
    localStorage.setItem('auth_token', token);
  },

  // Remove authentication token
  clearAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
  },

  // Get current token
  getAuthToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('auth_token');
  }
};

// Default export for backward compatibility
export default apiService;