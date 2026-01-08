// frontend/js/pages/auth/login.js
import authService from '../../services/auth-service.js';
import router from '../../app/router.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand flex items-center justify-center">
            <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h2 class="text-2xl font-bold text-uganda-black mb-6 text-center">Login</h2>
                
                <div id="errorMessage" class="error-message hidden mb-4"></div>
                
                <form id="loginForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
                            Email
                        </label>
                        <input type="email" id="email" name="email" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                            Password
                        </label>
                        <input type="password" id="password" name="password" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                    </div>
                    <button type="submit" 
                            class="w-full bg-uganda-yellow text-uganda-black font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition-colors">
                        Sign in
                    </button>
                </form>
                <p class="mt-4 text-center text-gray-600">
                    Don't have an account? 
                    <a href="/auth/register" class="text-uganda-yellow hover:underline" data-link>Register here</a>
                </p>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new LoginController();
};

class LoginController {
  constructor() {
    this.form = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.submitButton = null;
    this.errorMessage = null;
    
    this.init();
  }

  init() {
    // Redirect if already logged in
    if (authService.isAuthenticated()) {
      const dashboardPath = authService.getDashboardPath();
      router.navigate(dashboardPath);
      return;
    }

    this.bindElements();
    this.bindEvents();
    this.setupRealTimeValidation();
    
    console.log('🔐 Login controller initialized');
  }

  bindElements() {
    this.form = document.getElementById('loginForm');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    this.errorMessage = document.getElementById('errorMessage');
    
    if (!this.form) {
      console.error('❌ Login form not found');
      return;
    }
  }

  bindEvents() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Enter key support
    this.form.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.submitButton.disabled) {
        this.handleSubmit(e);
      }
    });

    // Clear error when user starts typing
    [this.emailInput, this.passwordInput].forEach(input => {
      input.addEventListener('input', () => {
        this.hideError();
        this.updateSubmitButton();
      });
    });
  }

  setupRealTimeValidation() {
    this.emailInput.addEventListener('blur', () => {
      this.validateEmail();
    });

    this.passwordInput.addEventListener('blur', () => {
      this.validatePassword();
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    await this.performLogin();
  }

  validateForm() {
    const emailValid = this.validateEmail();
    const passwordValid = this.validatePassword();
    
    return emailValid && passwordValid;
  }

  validateEmail() {
    const email = this.emailInput.value.trim();
    
    if (!email) {
      this.showFieldError(this.emailInput, 'Email is required');
      return false;
    }
    
    if (!authService.validateEmail(email)) {
      this.showFieldError(this.emailInput, 'Please enter a valid email address');
      return false;
    }
    
    this.clearFieldError(this.emailInput);
    return true;
  }

  validatePassword() {
    const password = this.passwordInput.value;
    
    if (!password) {
      this.showFieldError(this.passwordInput, 'Password is required');
      return false;
    }
    
    if (password.length < 6) {
      this.showFieldError(this.passwordInput, 'Password must be at least 6 characters');
      return false;
    }
    
    this.clearFieldError(this.passwordInput);
    return true;
  }

  async performLogin() {
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;

    this.setLoadingState(true);

    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        await this.handleLoginSuccess(result);
      } else {
        this.handleLoginError(result);
      }
    } catch (error) {
      this.handleLoginError({
        error: 'An unexpected error occurred. Please try again.',
        code: 500
      });
    } finally {
      this.setLoadingState(false);
    }
  }

  async handleLoginSuccess(result) {
    this.showSuccess('Login successful! Redirecting...');
    
    // Add a small delay to show success message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const dashboardPath = authService.getDashboardPath();
    router.navigate(dashboardPath);
  }

  handleLoginError(result) {
    let errorMessage = result.error;
    
    // Provide more user-friendly messages for common errors
    if (result.code === 401) {
      errorMessage = 'Invalid email or password. Please try again.';
    } else if (result.code === 429) {
      errorMessage = 'Too many login attempts. Please wait a few minutes.';
    } else if (result.code >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    this.showError(errorMessage);
    
    // Clear password field on error
    this.passwordInput.value = '';
    this.passwordInput.focus();
  }

  setLoadingState(loading) {
    if (this.submitButton) {
      if (loading) {
        this.submitButton.disabled = true;
        this.submitButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        `;
      } else {
        this.submitButton.disabled = false;
        this.submitButton.textContent = 'Sign in';
      }
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg';
    }
    
    // Also log to console for debugging
    console.error('Login error:', message);
  }

  showSuccess(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
    }
  }

  hideError() {
    if (this.errorMessage) {
      this.errorMessage.className = 'error-message hidden';
    }
  }

  showFieldError(input, message) {
    this.clearFieldError(input);
    
    input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    
    const errorElement = document.createElement('p');
    errorElement.className = 'mt-1 text-sm text-red-600';
    errorElement.textContent = message;
    errorElement.id = `${input.id}-error`;
    
    input.parentNode.appendChild(errorElement);
  }

  clearFieldError(input) {
    input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    input.classList.add('border-gray-300', 'focus:border-uganda-yellow', 'focus:ring-uganda-yellow');
    
    const existingError = document.getElementById(`${input.id}-error`);
    if (existingError) {
      existingError.remove();
    }
  }

  updateSubmitButton() {
    if (this.submitButton) {
      const email = this.emailInput.value.trim();
      const password = this.passwordInput.value;
      
      this.submitButton.disabled = !email || !password || password.length < 6;
    }
  }
}

export default LoginController;
