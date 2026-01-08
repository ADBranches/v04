// frontend/js/pages/auditor/moderation-dashboard.js
import AuthService from '../../services/auth-service.js';
import ModerationService from '../../services/moderation-service.js';
import GuideService from '../../services/guide-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

class ModerationDashboardController {
  constructor() {
    this.dashboardContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated() || AuthService.getCurrentUser().role !== 'auditor') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadDashboard();
  }

  bindElements() {
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
  }

  bindEvents() {
    const refreshButton = document.getElementById('refreshDashboard');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.loadDashboard());
    }
  }

  async loadDashboard() {
    this.setLoadingState(true);
    try {
      const [contentResponse, guideResponse] = await Promise.all([
        ModerationService.getContentQueue({ page: 1, limit: 10 }),
        GuideService.getPendingGuides({ page: 1, limit: 10 }),
      ]);
      this.renderDashboard({
        pendingContent: contentResponse.content.length,
        pendingGuides: guideResponse.guides.length,
      });
    } catch (error) {
      this.showError(error.message || 'Failed to load dashboard data');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderDashboard(data) {
    if (!this.dashboardContainer) return;

    this.dashboardContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
          <h3 class="text-lg font-semibold font-display text-uganda-black">Pending Content</h3>
          <p class="text-3xl font-bold text-uganda-yellow">${data.pendingContent}</p>
          <a href="/auditor/content-queue" data-link class="mt-4 inline-block bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Review Content</a>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
          <h3 class="text-lg font-semibold font-display text-uganda-black">Pending Guide Applications</h3>
          <p class="text-3xl font-bold text-uganda-yellow">${data.pendingGuides}</p>
          <a href="/auditor/guide-approvals" data-link class="mt-4 inline-block bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Review Guides</a>
        </div>
      </div>
    `;
  }

  setLoadingState(loading) {
    if (this.dashboardContainer) {
      this.dashboardContainer.innerHTML = loading
        ? '<div class="text-center py-8"><svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>'
        : '';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg font-african';
      setTimeout(() => {
        this.errorMessage.className = 'error-message hidden';
      }, 5000);
    }
    window.navigation.showNotification(message, 'error');
  }

  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.textContent = message;
      this.successMessage.className = 'success-message visible bg-safari-forest/10 border border-safari-forest text-safari-forest px-4 py-3 rounded-lg font-african';
      setTimeout(() => {
        this.successMessage.className = 'success-message hidden';
      }, 3000);
    }
    window.navigation.showNotification(message, 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ModerationDashboardController();
});

export default ModerationDashboardController;