// frontend/js/pages/guides/guide-verification.js
import AuthService from '../../services/auth-service.js';
import GuideService from '../../services/guide-service.js';
import router from '../../app/router.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <div id="navigation"></div>
            <div class="container mx-auto px-4 py-8">
                <div class="max-w-2xl mx-auto">
                    <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">Guide Verification Application</h1>
                    
                    <!-- Messages -->
                    <div id="errorMessage" class="error-message hidden mb-6"></div>
                    <div id="successMessage" class="success-message hidden mb-6"></div>
                    
                    <!-- Verification Form -->
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <form id="verificationForm" class="space-y-6">
                            <!-- Experience -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                                <input type="number" id="experience" name="experience" min="1" max="50" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                            </div>
                            
                            <!-- Certifications -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                                <div class="space-y-2" id="certificationsContainer">
                                    <input type="text" name="certifications" 
                                           placeholder="e.g., Tour Guide License, First Aid Certificate"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                </div>
                                <button type="button" onclick="addCertificationField()" 
                                        class="mt-2 text-uganda-yellow hover:text-yellow-400 text-sm font-african">
                                    + Add Another Certification
                                </button>
                            </div>
                            
                            <!-- Documents -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
                                <input type="file" id="documents" name="documents" multiple
                                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <p class="text-xs text-gray-500 mt-1">Upload relevant documents (licenses, certificates, ID copies)</p>
                            </div>
                            
                            <!-- Submit Button -->
                            <button type="submit" 
                                    class="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-display">
                                Submit Verification Request
                            </button>
                        </form>
                    </div>
                    
                    <!-- Back Link -->
                    <div class="text-center mt-6">
                        <a href="/dashboard/guide" data-link class="text-uganda-yellow hover:underline font-african">
                            ← Back to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        function addCertificationField() {
            const container = document.getElementById('certificationsContainer');
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'certifications';
            input.placeholder = 'Additional certification...';
            input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow mt-2';
            container.appendChild(input);
        }
        </script>
    `;
};

export const afterRender = () => {
    new GuideVerificationController();
};

class GuideVerificationController {
  constructor() {
    this.form = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated() || AuthService.getCurrentUser().role !== 'guide') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
  }

  bindElements() {
    this.form = document.getElementById('verificationForm');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.setLoadingState(true);

    try {
      const formData = new FormData(this.form);
      const credentials = {
        experience: formData.get('experience').trim(),
        certifications: formData.getAll('certifications').filter(cert => cert.trim()),
      };
      const documents = formData.getAll('documents');
      const response = await GuideService.submitVerification(credentials, documents);
      this.showSuccess('Verification request submitted successfully');
      setTimeout(() => router.navigate('/dashboard/guide'), 2000);
    } catch (error) {
      this.showError(error.message || 'Failed to submit verification');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    const submitButton = this.form?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.innerHTML = loading
        ? `<svg class="animate-spin h-5 w-5 text-uganda-black inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Submitting...`
        : 'Submit Verification';
      submitButton.className = loading
        ? 'bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg opacity-50 font-display'
        : 'bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg font-african';
    }
  }

  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.textContent = message;
      this.successMessage.className = 'success-message visible bg-safari-forest/10 border border-safari-forest text-safari-forest px-4 py-3 rounded-lg font-african';
      setTimeout(() => {
        this.successMessage.className = 'success-message hidden';
      }, 3000);
    }
  }
}

export default GuideVerificationController;