// frontend/js/app/app.js
import router from './router.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

// Initialize the application
function initApp() {
    console.log('🎉 Jumuiya Tours App Initializing...');
    
    // Debug: Check if DOM is ready
    console.log('🔍 DOM Content Loaded - starting app');
    console.log('🔍 Root element:', document.getElementById('app'));
    
    // Setup middleware for auth protection
    if (router.setMiddleware) {
        router.setMiddleware(authMiddleware);
        console.log('✅ Middleware set');
    }
    
    // Start the router explicitly
    if (router.start) {
        router.start();
        console.log('✅ Router started');
    } else {
        console.error('❌ Router start method not found');
        // Fallback: initialize manually
        router.init();
        router.loadInitialRoute();
    }
    
    console.log('✅ App initialized successfully');
    
    // Setup global auth state listener
    setupAuthListeners();
}

// Setup global authentication listeners
function setupAuthListeners() {
    window.addEventListener('authStateChanged', (event) => {
        const { isAuthenticated, user } = event.detail;
        console.log(`🔐 Auth state changed: ${isAuthenticated ? 'Logged in' : 'Logged out'}`);
        
        // Update UI based on auth state
        updateUIForAuthState(isAuthenticated, user);
    });
}

// Update UI elements based on authentication state
function updateUIForAuthState(isAuthenticated, user) {
    // This will be handled by individual page components
    // Navigation component already handles this via its own listener
    console.log('🔄 Auth state updated, UI should reflect changes');
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
});

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export for testing if needed
export { initApp, setupAuthListeners };