// frontend/js/services/auth-service.js
import { apiMethods } from './api.js';

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'current_user';
    this.timestampKey = 'auth_timestamp';
    this.tokenRefreshTime = 14 * 60 * 1000; // 14 minutes in milliseconds
    
    this.initializeAuthState();
  }

  initializeAuthState() {
    // Check if token is expired
    if (this.isTokenExpired()) {
      this.logout();
      return;
    }

    // Setup auto token refresh
    this.setupTokenRefresh();
  }

  // Login method
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const data = await apiMethods.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      if (data.user && data.token) {
        this.setAuthData(data.user, data.token);
        console.log('✅ Login successful for:', data.user.email);
        
        this.setupTokenRefresh();
        this.dispatchAuthEvent('login', data.user);
        
        return {
          success: true,
          user: data.user,
          message: data.message || 'Login successful'
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      const errorMessage = error.data?.error || 
                          error.originalError?.response?.data?.error || 
                          'Login failed. Please check your credentials.';
      
      return {
        success: false,
        error: errorMessage,
        code: error.status
      };
    }
  }

  // Register method
  async register(userData) {
    try {
      console.log('👤 Attempting registration for:', userData.email);
      
      const data = await apiMethods.post('/auth/register', {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password
      });

      if (data.user && data.token) {
        this.setAuthData(data.user, data.token);
        console.log('✅ Registration successful for:', data.user.email);
        
        this.setupTokenRefresh();
        this.dispatchAuthEvent('register', data.user);
        
        return {
          success: true,
          user: data.user,
          message: data.message || 'Registration successful'
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      const errorMessage = error.data?.error || 
                          error.originalError?.response?.data?.error || 
                          'Registration failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage,
        code: error.status
      };
    }
  }

  // Logout method
  logout() {
    const user = this.getCurrentUser();
    
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.timestampKey);
    
    console.log('👋 User logged out');
    this.dispatchAuthEvent('logout', user);
    
    // Clear any ongoing refresh attempts
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
  

  // Get current user
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.userKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      this.logout();
      return null;
    }
  }

  /**
   * Alias for getCurrentUser - for backward compatibility
   * @returns {Object|null} User object or null if not logged in
   */
  getUser() {
    return this.getCurrentUser();
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem(this.tokenKey);
    const user = this.getCurrentUser();
    
    return !!(token && user && !this.isTokenExpired());
  }

  // Check if token is expired
  isTokenExpired() {
    const timestamp = localStorage.getItem(this.timestampKey);
    if (!timestamp) return true;

    const loginTime = parseInt(timestamp);
    const currentTime = Date.now();
    const elapsed = currentTime - loginTime;

    return elapsed > (24 * 60 * 60 * 1000); // 24 hours
  }

  // Get auth token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const user = this.getCurrentUser();
    return roles.includes(user?.role);
  }

  // Check if user is guide (verified)
  isVerifiedGuide() {
    const user = this.getCurrentUser();
    return user?.role === 'guide' && user?.guide_status === 'verified';
  }

  // Refresh token (placeholder for future implementation)
  async refreshToken() {
    try {
      // This would call a refresh token endpoint if implemented
      console.log('🔄 Token refresh would happen here');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      if (this.isAuthenticated()) {
        this.refreshToken();
      }
    }, this.tokenRefreshTime);
  }

  // Set authentication data
  setAuthData(user, token) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.timestampKey, Date.now().toString());
  }

  // Dispatch auth events for other components to listen to
  dispatchAuthEvent(type, user = null) {
    const event = new CustomEvent('authChange', {
      detail: { type, user, isAuthenticated: this.isAuthenticated() }
    });
    window.dispatchEvent(event);
  }

  // Validate password strength
  validatePassword(password) {
    const requirements = {
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const isValid = Object.values(requirements).every(Boolean);
    const score = Object.values(requirements).filter(Boolean).length;

    return {
      isValid,
      score,
      requirements,
      strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
    };
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Get user dashboard path based on role
  getDashboardPath() {
    const user = this.getCurrentUser();
    if (!user) return '/auth/login';

    const dashboards = {
      'admin': '/dashboard/admin',
      'auditor': '/dashboard/auditor',
      'guide': '/dashboard/guide',
      'user': '/dashboard/user'
    };

    return dashboards[user.role] || '/dashboard/user';
  }

  // Add this method for role checking
  hasRequiredRole(requiredRole) {
      const user = this.getCurrentUser();
      if (!user) return false;
      
      const userRole = user.role;
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      return requiredRoles.includes(userRole);
  }

  // Update user profile in storage
  updateUserProfile(updatedUser) {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
      const mergedUser = { ...currentUser, ...updatedUser };
      localStorage.setItem(this.userKey, JSON.stringify(mergedUser));
      this.dispatchAuthEvent('profileUpdate', mergedUser);
    }
  }
}

const authService = new AuthService();
export default authService;