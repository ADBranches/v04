// frontend/js/pages/auth/register.js
import authService from '../../services/auth-service.js';
import router from '../../app/router.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand flex items-center justify-center">
            <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h2 class="text-2xl font-bold text-uganda-black mb-6 text-center">Create Account</h2>
                
                <div id="errorMessage" class="error-message hidden mb-4"></div>
                <div id="successMessage" class="success-message hidden mb-4"></div>
                
                <form id="registerForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
                            Full Name
                        </label>
                        <input type="text" id="name" name="name" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
                            Email
                        </label>
                        <input type="email" id="email" name="email" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                            Password
                        </label>
                        <input type="password" id="password" name="password" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                        <div id="password-strength" class="hidden"></div>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="confirmPassword">
                            Confirm Password
                        </label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                    </div>
                    <button type="submit" 
                            class="w-full bg-uganda-yellow text-uganda-black font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition-colors">
                        Create Account
                    </button>
                </form>
                <p class="mt-4 text-center text-gray-600">
                    Already have an account? 
                    <a href="/auth/login" class="text-uganda-yellow hover:underline" data-link>Login here</a>
                </p>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new RegisterController();
};

class RegisterController {
  constructor() {
    this.form = null;
    this.nameInput = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.confirmPasswordInput = null;
    this.submitButton = null;
    this.errorMessage = null;
    this.successMessage = null;
    
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
    this.setupPasswordStrength();
    
    console.log('👤 Register controller initialized');
  }

  bindElements() {
    this.form = document.getElementById('registerForm');
    this.nameInput = document.getElementById('name');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.confirmPasswordInput = document.getElementById('confirmPassword');
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
    
    if (!this.form) {
      console.error('❌ Register form not found');
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

    // Clear errors when user starts typing
    [this.nameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
      input.addEventListener('input', () => {
        this.hideMessages();
        this.updateSubmitButton();
        this.validatePasswordsMatch();
      });
    });
  }

  setupRealTimeValidation() {
    this.nameInput.addEventListener('blur', () => {
      this.validateName();
    });

    this.emailInput.addEventListener('blur', () => {
      this.validateEmail();
    });

    this.passwordInput.addEventListener('blur', () => {
      this.validatePassword();
    });

    this.confirmPasswordInput.addEventListener('blur', () => {
      this.validatePasswordConfirmation();
    });
  }

  setupPasswordStrength() {
    this.passwordInput.addEventListener('input', () => {
      this.updatePasswordStrength();
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    await this.performRegistration();
  }

  validateForm() {
    const nameValid = this.validateName();
    const emailValid = this.validateEmail();
    const passwordValid = this.validatePassword();
    const confirmValid = this.validatePasswordConfirmation();
    
    return nameValid && emailValid && passwordValid && confirmValid;
  }

  validateName() {
    const name = this.nameInput.value.trim();
    
    if (!name) {
      this.showFieldError(this.nameInput, 'Full name is required');
      return false;
    }
    
    if (name.length < 2) {
      this.showFieldError(this.nameInput, 'Name must be at least 2 characters');
      return false;
    }
    
    this.clearFieldError(this.nameInput);
    return true;
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
    
    const validation = authService.validatePassword(password);
    
    if (!validation.isValid) {
      const requirements = [];
      if (!validation.requirements.minLength) requirements.push('at least 6 characters');
      if (!validation.requirements.hasUpperCase) requirements.push('one uppercase letter');
      if (!validation.requirements.hasLowerCase) requirements.push('one lowercase letter');
      if (!validation.requirements.hasNumbers) requirements.push('one number');
      if (!validation.requirements.hasSpecialChar) requirements.push('one special character');
      
      this.showFieldError(this.passwordInput, `Password needs: ${requirements.join(', ')}`);
      return false;
    }
    
    this.clearFieldError(this.passwordInput);
    return true;
  }

  validatePasswordConfirmation() {
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;
    
    if (!confirmPassword) {
      this.showFieldError(this.confirmPasswordInput, 'Please confirm your password');
      return false;
    }
    
    if (password !== confirmPassword) {
      this.showFieldError(this.confirmPasswordInput, 'Passwords do not match');
      return false;
    }
    
    this.clearFieldError(this.confirmPasswordInput);
    return true;
  }

  validatePasswordsMatch() {
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      this.confirmPasswordInput.classList.add('border-red-300');
      this.confirmPasswordInput.classList.remove('border-gray-300');
    } else if (password && confirmPassword && password === confirmPassword) {
      this.confirmPasswordInput.classList.remove('border-red-300');
      this.confirmPasswordInput.classList.add('border-gray-300');
    }
  }

  updatePasswordStrength() {
    const password = this.passwordInput.value;
    const strengthMeter = document.getElementById('password-strength');
    
    if (!strengthMeter) return;
    
    if (!password) {
      strengthMeter.className = 'hidden';
      return;
    }
    
    const validation = authService.validatePassword(password);
    
    strengthMeter.className = 'mt-2';
    strengthMeter.innerHTML = this.createStrengthHTML(validation);
  }

  createStrengthHTML(validation) {
    const { strength, score, requirements } = validation;
    
    const strengthColors = {
      weak: 'bg-red-500',
      medium: 'bg-yellow-500',
      strong: 'bg-green-500'
    };
    
    const strengthText = {
      weak: 'Weak password',
      medium: 'Medium strength',
      strong: 'Strong password'
    };
    
    return `
      <div class="space-y-2">
        <div class="flex space-x-1">
          ${[1, 2, 3, 4, 5].map(i => `
            <div class="h-2 flex-1 rounded-full bg-gray-200 ${i <= score ? strengthColors[strength] : ''}"></div>
          `).join('')}
        </div>
        <p class="text-sm ${strength === 'weak' ? 'text-red-600' : strength === 'medium' ? 'text-yellow-600' : 'text-green-600'}">
          ${strengthText[strength]}
        </p>
        ${strength !== 'strong' ? `
          <div class="text-xs text-gray-600">
            <p>Requirements:</p>
            <ul class="list-disc list-inside space-y-1 mt-1">
              ${!requirements.minLength ? '<li>At least 6 characters</li>' : ''}
              ${!requirements.hasUpperCase ? '<li>One uppercase letter</li>' : ''}
              ${!requirements.hasLowerCase ? '<li>One lowercase letter</li>' : ''}
              ${!requirements.hasNumbers ? '<li>One number</li>' : ''}
              ${!requirements.hasSpecialChar ? '<li>One special character</li>' : ''}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  async performRegistration() {
    const userData = {
      name: this.nameInput.value.trim(),
      email: this.emailInput.value.trim().toLowerCase(),
      password: this.passwordInput.value
    };

    this.setLoadingState(true);

    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        await this.handleRegistrationSuccess(result);
      } else {
        this.handleRegistrationError(result);
      }
    } catch (error) {
      this.handleRegistrationError({
        error: 'An unexpected error occurred. Please try again.',
        code: 500
      });
    } finally {
      this.setLoadingState(false);
    }
  }

  async handleRegistrationSuccess(result) {
    this.showSuccess('Account created successfully! Redirecting to dashboard...');
    
    // Add a small delay to show success message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardPath = authService.getDashboardPath();
    router.navigate(dashboardPath);
  }

  handleRegistrationError(result) {
    let errorMessage = result.error;
    
    // Provide more user-friendly messages for common errors
    if (result.code === 409) {
      errorMessage = 'An account with this email already exists.';
    } else if (result.code === 400) {
      errorMessage = 'Please check your information and try again.';
    } else if (result.code === 429) {
      errorMessage = 'Too many registration attempts. Please wait a few minutes.';
    } else if (result.code >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    this.showError(errorMessage);
    
    // Clear password fields on error
    this.passwordInput.value = '';
    this.confirmPasswordInput.value = '';
    this.updatePasswordStrength();
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
          Creating Account...
        `;
      } else {
        this.submitButton.disabled = false;
        this.submitButton.textContent = 'Create Account';
      }
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg';
    }
    
    console.error('Registration error:', message);
  }

  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.textContent = message;
      this.successMessage.className = 'success-message visible bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
    }
  }

  hideMessages() {
    if (this.errorMessage) {
      this.errorMessage.className = 'error-message hidden';
    }
    if (this.successMessage) {
      this.successMessage.className = 'success-message hidden';
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
      const name = this.nameInput.value.trim();
      const email = this.emailInput.value.trim();
      const password = this.passwordInput.value;
      const confirmPassword = this.confirmPasswordInput.value;
      
      const hasValidName = name.length >= 2;
      const hasValidEmail = authService.validateEmail(email);
      const hasValidPassword = password.length >= 6;
      const passwordsMatch = password === confirmPassword;
      
      this.submitButton.disabled = !(hasValidName && hasValidEmail && hasValidPassword && passwordsMatch);
    }
  }
}

export default RegisterController;
