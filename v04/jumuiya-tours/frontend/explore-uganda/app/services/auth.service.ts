import { apiMethods } from './api-service';
import type { 
  LoginRequest, 
  RegisterRequest, 
  RegisterResponse, 
  AuthState 
} from './types/auth';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'guide' | 'auditor' | 'admin';
  guide_status?: 'unverified' | 'pending' | 'verified';
  is_verified_guide?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
  code?: number;
}

export interface PasswordValidation {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
}

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';
  private timestampKey = 'auth_timestamp';
  private tokenRefreshTime = 14 * 60 * 1000; // 14 minutes
  private refreshTimeout?: NodeJS.Timeout;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // ✅ Safe localStorage access
  private getStorageItem(key: string): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(key);
  }

  private setStorageItem(key: string, value: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(key, value);
  }

  private removeStorageItem(key: string): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(key);
  }
  constructor() {
    if (this.isBrowser()) {
      this.initializeAuthState();
    }
  }
  
  initializeAuthState() {
    if (this.isTokenExpired()) {
      this.logout();
      return;
    }
    this.setupTokenRefresh();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const data = await apiMethods.post<{ user: User; token: string; message?: string }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      if (data.user && data.token) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        // Ensure is_verified_guide is set based on guide_status
        const userWithVerifiedFlag = {
          ...data.user,
          is_verified_guide: data.user.guide_status === 'verified'
        };
        
        this.setAuthData(userWithVerifiedFlag, data.token);
        console.log('✅ Login successful for:', data.user.email);
        
        this.setupTokenRefresh();
        this.dispatchAuthEvent('login', userWithVerifiedFlag);
        
        return {
          success: true,
          user: userWithVerifiedFlag,
          token: data.token,
          message: data.message || 'Login successful'
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      if (import.meta.env.MODE === "development") {
        console.warn("⚠️ Login failed:", error.message || error);
      } else {
        console.info("%c⚠️ Invalid credentials or network issue", "color: orange");
      }
      
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

  async register(userData: { name: string; email: string; password: string }): Promise<LoginResponse> {
    try {
      console.log('👤 Attempting registration for:', userData.email);
      
      const data = await apiMethods.post<{ user: User; token: string; message?: string }>('/auth/register', {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password
      });

      if (data.user && data.token) {
        // localStorage.removeItem("token");
        // localStorage.removeItem("auth_token");

        // Ensure is_verified_guide is set based on guide_status
        const userWithVerifiedFlag = {
          ...data.user,
          is_verified_guide: data.user.guide_status === 'verified'
        };
        
        this.setAuthData(userWithVerifiedFlag, data.token);
        console.log('✅ Registration successful for:', data.user.email);
        
        this.setupTokenRefresh();
        this.dispatchAuthEvent('register', userWithVerifiedFlag);
        
        return {
          success: true,
          user: userWithVerifiedFlag,
          token: data.token,
          message: data.message || 'Registration successful'
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      if (import.meta.env.MODE === "development"){
        console.warn("⚠️ Registration failed:", error.message || error);
      } else {
        console.error("%c⚠️ Registration failed", "color: orange");
      }
      
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

  // Core authentication methods matching your header interface
  getCurrentUser(): User | null {
    try {
      // ✅ FIX: Check if we're in browser environment first
      if (!this.isBrowser()) {
        return null;
      }

      // Try primary key first, then legacy key for compatibility
      const userStr = this.getStorageItem(this.userKey) || this.getStorageItem('current_user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      
      // Ensure is_verified_guide is always set
      return {
        ...user,
        is_verified_guide: user.guide_status === 'verified' || user.is_verified_guide === true
      };
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      this.logout();
      return null;
    }
  }

  setCurrentUser(user: User, token: string): void {
    if(!this.isBrowser()) return;
    
    // Ensure is_verified_guide is set
    const userWithVerifiedFlag = {
      ...user,
      is_verified_guide: user.guide_status === 'verified'
    };
    
    this.setStorageItem(this.userKey, JSON.stringify(userWithVerifiedFlag));
    this.setStorageItem(this.tokenKey, token);
    this.setStorageItem(this.timestampKey, Date.now().toString());
    
    // Also set legacy keys for compatibility
    this.setStorageItem('current_user', JSON.stringify(userWithVerifiedFlag));
    this.setStorageItem('auth_token', token);
    
    this.setupTokenRefresh();
    this.dispatchAuthEvent('userUpdate', userWithVerifiedFlag);
  }

  logout(): void {

    if(!this.isBrowser()) return;

    const user = this.getCurrentUser();
    
    this.removeStorageItem(this.tokenKey);
    this.removeStorageItem(this.userKey);
    this.removeStorageItem(this.timestampKey);
    
    // Also clear legacy keys for compatibility
    this.removeStorageItem('auth_token');
    this.removeStorageItem('current_user');
    
    console.log('👋 User logged out');
    this.dispatchAuthEvent('logout', user);
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  isAuthenticated(): boolean {
    if(!this.isBrowser()) return false;

    const token = this.getStorageItem(this.tokenKey) || this.getStorageItem('auth_token');
    const user = this.getCurrentUser();
    return !!(token && user && !this.isTokenExpired());
  }

  // Alias for getCurrentUser for compatibility
  getUser(): User | null {
    return this.getCurrentUser();
  }

  // Token management
  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return (
      this.getStorageItem(this.tokenKey) ||
      this.getStorageItem('auth_token') ||
      this.getStorageItem('jwt_token') // ✅ covers any old localStorage naming
    );
  }

  private isTokenExpired(): boolean {
    if (!this.isBrowser()) return true; // ✅ Prevent SSR crash
    const timestamp = this.getStorageItem(this.timestampKey);
    if (!timestamp) return true;

    const loginTime = parseInt(timestamp);
    const currentTime = Date.now();
    const elapsed = currentTime - loginTime;

    return elapsed > 24 * 60 * 60 * 1000; // 24 hours
  }

  async refreshToken(): Promise<boolean> {
    try {
      const currentToken = this.getToken();
      if (!currentToken) {
        console.warn('⚠️ No token available for refresh');
        return false;
      }

      console.log('🔄 Refreshing token...');
      // Implement token refresh logic here when backend supports it
      // const response = await apiMethods.post('/auth/refresh', { token: currentToken });
      // if (response.token) {
      //   this.setAuthData(this.getCurrentUser()!, response.token);
      //   return true;
      // }
      
      return true; // Temporary return until refresh endpoint is implemented
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  private setupTokenRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().then(success => {
          if (success) {
            console.log('✅ Token refreshed successfully');
          }
        });
      }
    }, this.tokenRefreshTime);
  }

  private setAuthData(user: User, token: string): void {
    this.setCurrentUser(user, token);
  }

  // Role-based access control methods
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.includes(user?.role || '');
  }

  isVerifiedGuide(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'guide' && user?.guide_status === 'verified';
  }

  // Enhanced role checking with permissions
  hasRequiredRole(requiredRole: string | string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const userRole = user.role;
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    return requiredRoles.includes(userRole);
  }

  canAccess(requiredRole: string | string[]): boolean {
    return this.hasRequiredRole(requiredRole);
  }

  // Event system for auth state changes
  private dispatchAuthEvent(type: string, user: User | null = null): void {
    const event = new CustomEvent('authChange', {
      detail: { 
        type, 
        user, 
        isAuthenticated: this.isAuthenticated(),
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }

  // Validation utilities
  validatePassword(password: string): PasswordValidation {
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

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Navigation helpers
  // Navigation helpers
  getDashboardPath(): string {
    const user = this.getCurrentUser();
    if (!user) return '/auth/login';

    // Map user roles to the actual existing route files
    const dashboards: Record<string, string> = {
      admin: '/dashboard/admin',
      auditor: '/dashboard/auditor',
      guide: '/dashboard/guide',
      user: '/dashboard/user',
    };

    // Ensure we always redirect to a valid dashboard route
    const role = user.role?.toLowerCase?.();
    return dashboards[role] || '/dashboard/user';
  }


  getDefaultRoute(): string {
    if (!this.isAuthenticated()) {
      return '/auth/login';
    }
    return this.getDashboardPath();
  }

  // User profile management
  updateUserProfile(updatedUser: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const mergedUser = { 
        ...currentUser, 
        ...updatedUser,
        // Ensure is_verified_guide stays in sync
        is_verified_guide: updatedUser.guide_status === 'verified' || 
                           (updatedUser.is_verified_guide ?? currentUser.is_verified_guide)
      };
      
      if (!this.isBrowser()) return;
      this.setStorageItem(this.userKey, JSON.stringify(mergedUser));
      this.setStorageItem('current_user', JSON.stringify(mergedUser)); // legacy
      
      this.dispatchAuthEvent('profileUpdate', mergedUser);
      console.log('✅ User profile updated');
    }
  }

  // Session management
  getSessionDuration(): number {
    if (!this.isBrowser()) return 0;
    const timestamp = this.getStorageItem(this.timestampKey);
    if (!timestamp) return 0;
    return Date.now() - parseInt(timestamp);
  }

  getSessionTimeRemaining(): number {
    if (!this.isBrowser()) return 0;
    const sessionDuration = this.getSessionDuration();
    const maxSessionTime = 24 * 60 * 60 * 1000; // 24 hours
    return Math.max(0, maxSessionTime - sessionDuration);
  }

  // Security utilities
  clearSensitiveData(): void {
    this.logout();
    // Clear any other sensitive data if needed
  }

  // Debug and development helpers
  debugAuthState(): void {
    console.group('🔐 Auth Service Debug');
    console.log('Authenticated:', this.isAuthenticated());
    console.log('Current User:', this.getCurrentUser());
    console.log('Token Available:', !!this.getToken());
    console.log('Session Duration:', this.getSessionDuration());
    console.log('Time Remaining:', this.getSessionTimeRemaining());
    console.groupEnd();
  }
}

// Create singleton instance with the exact interface your header expects
const authServiceInstance = new AuthService();

const authService = {
  getCurrentUser: () => authServiceInstance.getCurrentUser(),
  setCurrentUser: (user: User, token: string) => authServiceInstance.setCurrentUser(user, token),
  logout: () => authServiceInstance.logout(),
  isAuthenticated: () => authServiceInstance.isAuthenticated(),
  login: (email: string, password: string) => authServiceInstance.login(email, password),
  register: (userData: { name: string; email: string; password: string }) =>
    authServiceInstance.register(userData),
  getToken: () => authServiceInstance.getToken(),
  hasRole: (role: string) => authServiceInstance.hasRole(role),
  hasAnyRole: (roles: string[]) => authServiceInstance.hasAnyRole(roles),
  isVerifiedGuide: () => authServiceInstance.isVerifiedGuide(),
  hasRequiredRole: (requiredRole: string | string[]) => authServiceInstance.hasRequiredRole(requiredRole),
  canAccess: (requiredRole: string | string[]) => authServiceInstance.canAccess(requiredRole),
  validatePassword: (password: string) => authServiceInstance.validatePassword(password),
  validateEmail: (email: string) => authServiceInstance.validateEmail(email),
  getDashboardPath: () => authServiceInstance.getDashboardPath(),
  getDefaultRoute: () => authServiceInstance.getDefaultRoute(),
  updateUserProfile: (updatedUser: Partial<User>) => authServiceInstance.updateUserProfile(updatedUser),
  debugAuthState: () => authServiceInstance.debugAuthState(),
};

// Export both the instance and class for testing
export { authService, AuthService };
export default authService;
