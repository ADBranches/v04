// frontend/js/pages/home/home.js
import authService from '../../services/auth-service.js';

export async function render() {
    // Fetch your existing home view HTML
    const response = await fetch('/views/home.html');
    const html = await response.text();
    return html;
}

export function afterRender() {
    console.log('🏠 Home page rendered');
    
    // Update auth buttons based on login state
    function updateAuthButtons() {
        const authButtons = document.getElementById('auth-buttons');
        
        if (!authButtons) {
            console.warn('❌ auth-buttons element not found');
            return;
        }
        
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            authButtons.innerHTML = `
                <span class="text-uganda-black">Welcome, ${user?.name || 'User'}!</span>
                <a href="/dashboard" data-link class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-full font-semibold hover:bg-yellow-400 transition-colors">
                    Dashboard
                </a>
                <button onclick="handleLogout()" class="text-uganda-black hover:text-uganda-red transition-colors">Logout</button>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="/auth/login" data-link class="text-uganda-black hover:text-uganda-yellow transition-colors">Login</a>
                <a href="/auth/register" data-link class="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-full font-semibold hover:bg-yellow-400 transition-colors">
                    Join Adventure
                </a>
            `;
        }
    }
    
    // Add global logout handler
    window.handleLogout = () => {
        authService.logout();
        window.location.reload();
    };
    
    updateAuthButtons();
    
    // Listen for auth changes
    window.addEventListener('authChange', updateAuthButtons);
}
