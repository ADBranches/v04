console.log('🔄 Loading auth-middleware.js...');

import authService from '../services/auth-service.js';

console.log('✅ authService imported in middleware:', authService);
class AuthMiddleware {
    
    constructor() {
        console.log('🔄 AuthMiddleware constructor');

        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    async init() {
        if (this.token) {
            await this.validateToken();
        }
    }

    // Validate token on app startup
    async validateToken() {
        try {
            const user = await authService.validateToken(this.token);
            if (user) {
                this.currentUser = user;
                this.token = user.token;
                localStorage.setItem('authToken', user.token);
                localStorage.setItem('userData', JSON.stringify(user));
            } else {
                this.clearAuth();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.clearAuth();
        }
    }

    // Check if user is authenticated
    async checkAuth() {
        if (!this.token) {
            return false;
        }

        try {
            const user = await authService.validateToken(this.token);
            if (user) {
                this.currentUser = user;
                return true;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }

        this.clearAuth();
        return false;
    }

    // Check if user has specific role
    hasRole(requiredRole) {
        if (!this.currentUser) return false;
        
        // Handle multiple roles
        const userRoles = this.currentUser.roles || [this.currentUser.role];
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        return requiredRoles.some(role => userRoles.includes(role));
    }

    // Check if user has any of the required roles
    hasAnyRole(requiredRoles) {
        return this.hasRole(requiredRoles);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user token
    getToken() {
        return this.token;
    }

    // Set authentication after login
    setAuth(token, userData) {
        this.token = token;
        this.currentUser = userData;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Dispatch auth change event
        this.dispatchAuthChange();
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.currentUser = null;
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Dispatch auth change event
        this.dispatchAuthChange();
    }

    // Check if user can access route based on roles
    async canAccess(requiredRoles = []) {
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            return false;
        }

        if (requiredRoles.length === 0) {
            return true; // No role requirement
        }

        return this.hasRole(requiredRoles);
    }

    // Route guard middleware
    async routeGuard(requiredRoles = []) {
        const canAccess = await this.canAccess(requiredRoles);
        
        if (!canAccess) {
            // Redirect to login or unauthorized page
            if (!this.currentUser) {
                window.location.href = '/auth/login';
            } else {
                window.location.href = '/unauthorized';
            }
            return false;
        }

        return true;
    }

    // Dispatch authentication state change
    dispatchAuthChange() {
        const event = new CustomEvent('authStateChanged', {
            detail: {
                isAuthenticated: !!this.currentUser,
                user: this.currentUser
            }
        });
        window.dispatchEvent(event);
    }

    // Check if token is about to expire
    isTokenExpiringSoon() {
        if (!this.currentUser || !this.currentUser.exp) {
            return false;
        }

        const expTime = this.currentUser.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        return (expTime - currentTime) < bufferTime;
    }

    // Refresh token
    async refreshToken() {
        if (!this.token) {
            throw new Error('No token available to refresh');
        }

        try {
            const newToken = await authService.refreshToken(this.token);
            this.token = newToken;
            localStorage.setItem('authToken', newToken);
            
            // Update user data with new token
            if (this.currentUser) {
                this.currentUser.token = newToken;
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
            }
            
            return newToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearAuth();
            throw error;
        }
    }

    // Auto-refresh token if expiring soon
    async autoRefreshToken() {
        if (this.isTokenExpiringSoon()) {
            try {
                await this.refreshToken();
                console.log('Token auto-refreshed successfully');
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }
    }
}

// Create singleton instance
export const authMiddleware = new AuthMiddleware();
console.log('✅ auth-middleware.js fully loaded');

// Initialize auto token refresh
setInterval(() => {
    authMiddleware.autoRefreshToken();
}, 60000); // Check every minute