// frontend/js/pages/guides/guide-profile.js
import AuthService from '../../services/auth-service.js';
import GuideService from '../../services/guide-service.js';
import router from '../../app/router.js';

class GuideProfileController {
  constructor() {
    this.profileContainer = null;
    this.errorMessage = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated()) {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.loadProfile();
  }

  bindElements() {
    this.profileContainer = document.getElementById('profileContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  async loadProfile() {
    this.setLoadingState(true);
    try {
      const user = AuthService.getCurrentUser();
      const verification = await GuideService.getVerification(user.id);
      this.renderProfile(user, verification?.verification);
    } catch (error) {
      this.showError(error.message || 'Failed to load profile');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderProfile(user, verification) {
    if (!this.profileContainer) return;

    const credentials = verification ? JSON.parse(verification.credentials) : null;
    this.profileContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Guide Profile</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}${user.guide_status === 'verified' ? ' ✓' : ''}</p>
          </div>
          <div>
            ${verification ? `
              <p><strong>Verification Status:</strong> <span class="${verification.status === 'approved' ? 'text-safari-forest' : verification.status === 'rejected' ? 'text-uganda-red' : 'text-gray-600'}">${verification.status}</span></p>
              ${credentials ? `
                <p><strong>Experience:</strong> ${credentials.experience}</p>
                <p><strong>Certifications:</strong> ${credentials.certifications.join(', ')}</p>
              ` : ''}
              ${verification.documents.length > 0 ? `
                <p><strong>Documents:</strong></p>
                <ul class="list-disc list-inside">
                  ${verification.documents.map(doc => `<li><a href="${doc}" target="_blank" class="text-uganda-yellow hover:underline">View Document</a></li>`).join('')}
                </ul>
              ` : ''}
              ${verification.notes ? `<p><strong>Notes:</strong> ${verification.notes}</p>` : ''}
            ` : `
              <p class="text-gray-600">No verification request submitted.</p>
              <a href="/guides/verification" data-link class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display mt-4 inline-block">Submit Verification</a>
            `}
          </div>
        </div>
      </div>
    `;
  }

  setLoadingState(loading) {
    if (this.profileContainer) {
      this.profileContainer.innerHTML = loading
        ? '<div class="text-center py-8"><svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>'
        : '';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg font-african';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GuideProfileController();
});

export default GuideProfileController;