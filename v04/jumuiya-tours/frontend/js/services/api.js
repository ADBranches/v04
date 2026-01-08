// frontend/js/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and track requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    // config.headers['X-Request-ID'] = generateRequestId();
    
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

// Response interceptor to handle errors and logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    const { response } = error;
    
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: response?.status,
      data: response?.data,
      message: error.message
    });

    // Handle specific error cases
    if (response?.status === 401) {
      console.warn('🔐 Authentication failed, redirecting to login...');
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
      // Show permission denied message
      showNotification('You do not have permission to perform this action.', 'error');
    } else if (response?.status === 429) {
      console.warn('⏰ Rate limit exceeded');
      showNotification('Too many requests. Please try again later.', 'warning');
    } else if (response?.status >= 500) {
      console.error('🔥 Server error occurred');
      showNotification('Server error. Please try again later.', 'error');
    } else if (!response) {
      console.error('🌐 Network error - server unreachable');
      showNotification('Network error. Please check your connection.', 'error');
    }

    return Promise.reject(error);
  }
);

// Helper function to generate unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
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
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current hover:opacity-70">
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

// API methods with enhanced error handling
export const apiMethods = {
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'GET', url);
    }
  },

  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'POST', url);
    }
  },

  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'PUT', url);
    }
  },

  async patch(url, data = {}, config = {}) {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'PATCH', url);
    }
  },

  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw enhanceError(error, 'DELETE', url);
    }
  }
};

// Enhance error with additional context
function enhanceError(error, method, url) {
  const enhancedError = new Error(error.message);
  enhancedError.originalError = error;
  enhancedError.method = method;
  enhancedError.url = url;
  enhancedError.timestamp = new Date().toISOString();
  enhancedError.status = error.response?.status;
  enhancedError.data = error.response?.data;
  
  return enhancedError;
}

// Health check function
export const checkAPIHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      status: 'healthy',
      data: response.data
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Export the axios instance for direct use if needed
export { api };

export default apiMethods;
