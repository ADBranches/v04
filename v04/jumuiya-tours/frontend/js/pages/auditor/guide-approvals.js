// frontend/js/pages/auditor/guide-approvals.js
import AuthService from '../../services/auth-service.js';
import GuideService from '../../services/guide-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

class GuideApprovalsController {
  constructor() {
    this.guideContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.filterForm = null;
    this.paginationContainer = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated() || AuthService.getCurrentUser().role !== 'auditor') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadPendingGuides();
  }

  bindElements() {
    this.guideContainer = document.getElementById('guideContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
    this.filterForm = document.getElementById('filterForm');
    this.paginationContainer = document.getElementById('paginationContainer');
  }

  bindEvents() {
    if (this.filterForm) {
      this.filterForm.addEventListener('submit', (e) => this.handleFilterSubmit(e));
    }
  }

  async handleFilterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.filterForm);
    const params = {
      guide_status: formData.get('guide_status'),
      page: 1,
      limit: 10,
    };
    await this.loadPendingGuides(params);
  }

  async loadPendingGuides(params = { page: 1, limit: 10 }) {
    this.setLoadingState(true);
    try {
      const response = await GuideService.getPendingGuides(params);
      this.renderGuides(response.guides, response.pagination);
    } catch (error) {
      this.showError(error.message || 'Failed to load pending guides');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderGuides(guides, pagination) {
    if (!this.guideContainer || !this.paginationContainer) return;

    this.guideContainer.innerHTML = guides.length === 0
      ? '<p class="text-gray-600 text-center py-8 font-african">No pending guide applications found.</p>'
      : `
        <div class="grid grid-cols-1 gap-6">
          ${guides.map(guide => `
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h3 class="text-lg font-semibold font-display text-uganda-black">${guide.name}</h3>
              <p class="text-gray-600 mb-2">Email: ${guide.email}</p>
              <p class="text-gray-600 mb-2">Guide Status: ${guide.guide_status}</p>
              <p class="text-gray-600 mb-4">Verification Documents: ${guide.verification_documents?.length || 0} uploaded</p>
              <div class="flex space-x-2">
                <button onclick="new GuideApprovalsController().verifyGuide(${guide.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-safari-dark-forest font-african">Verify</button>
                <button onclick="new GuideApprovalsController().rejectGuide(${guide.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    this.paginationContainer.innerHTML = `
      <div class="flex justify-center space-x-2 mt-6">
        ${pagination.page > 1 ? `
          <button onclick="new GuideApprovalsController().loadPendingGuides({ page: ${pagination.page - 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Previous</button>
        ` : ''}
        <span class="px-4 py-2 text-uganda-black font-african">Page ${pagination.page} of ${pagination.pages}</span>
        ${pagination.page < pagination.pages ? `
          <button onclick="new GuideApprovalsController().loadPendingGuides({ page: ${pagination.page + 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Next</button>
        ` : ''}
      </div>
    `;
  }

  async verifyGuide(id) {
    this.setLoadingState(true);
    try {
      await GuideService.verifyGuide(id);
      this.showSuccess('Guide verified successfully');
      this.loadPendingGuides();
    } catch (error) {
      this.showError(error.message || 'Failed to verify guide');
    } finally {
      this.setLoadingState(false);
    }
  }

  async rejectGuide(id) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    this.setLoadingState(true);
    try {
      await GuideService.rejectGuide(id, reason);
      this.showSuccess('Guide application rejected successfully');
      this.loadPendingGuides();
    } catch (error) {
      this.showError(error.message || 'Failed to reject guide');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    if (this.guideContainer) {
      this.guideContainer.innerHTML = loading
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
  new GuideApprovalsController();
});

export default GuideApprovalsController;
