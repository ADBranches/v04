// frontend/js/pages/auditor/content-queue.js
import AuthService from '../../services/auth-service.js';
import ModerationService from '../../services/moderation-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

class ContentQueueController {
  constructor() {
    this.contentContainer = null;
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
    this.loadContentQueue();
  }

  bindElements() {
    this.contentContainer = document.getElementById('contentContainer');
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
      content_type: formData.get('content_type'),
      page: 1,
      limit: 10,
    };
    await this.loadContentQueue(params);
  }

  async loadContentQueue(params = { page: 1, limit: 10 }) {
    this.setLoadingState(true);
    try {
      const response = await Moder/patternService.getContentQueue(params);
      this.renderContent(response.content, response.pagination);
    } catch (error) {
      this.showError(error.message || 'Failed to load content queue');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderContent(content, pagination) {
    if (!this.contentContainer || !this.paginationContainer) return;

    this.contentContainer.innerHTML = content.length === 0
      ? '<p class="text-gray-600 text-center py-8 font-african">No pending content found.</p>'
      : `
        <div class="grid grid-cols-1 gap-6">
          ${content.map(item => `
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h3 class="text-lg font-semibold font-display text-uganda-black">${item.destination.name}</h3>
              <p class="text-gray-600 mb-2">Region: ${item.destination.region}${item.destination.district ? `, ${item.destination.district}` : ''}</p>
              <p class="text-gray-600 mb-2">Created by: ${item.creator.name}</p>
              <p class="text-gray-600 mb-4">${item.destination.short_description}</p>
              <div class="flex space-x-2">
                <button onclick="new ContentQueueController().approveContent(${item.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-safari-dark-forest font-african">Approve</button>
                <button onclick="new ContentQueueController().rejectContent(${item.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    this.paginationContainer.innerHTML = `
      <div class="flex justify-center space-x-2 mt-6">
        ${pagination.page > 1 ? `
          <button onclick="new ContentQueueController().loadContentQueue({ page: ${pagination.page - 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Previous</button>
        ` : ''}
        <span class="px-4 py-2 text-uganda-black font-african">Page ${pagination.page} of ${pagination.pages}</span>
        ${pagination.page < pagination.pages ? `
          <button onclick="new ContentQueueController().loadContentQueue({ page: ${pagination.page + 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Next</button>
        ` : ''}
      </div>
    `;
  }

  async approveContent(id) {
    this.setLoadingState(true);
    try {
      await ModerationService.approveContent(id);
      this.showSuccess('Content approved successfully');
      this.loadContentQueue();
    } catch (error) {
      this.showError(error.message || 'Failed to approve content');
    } finally {
      this.setLoadingState(false);
    }
  }

  async rejectContent(id) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    this.setLoadingState(true);
    try {
      await ModerationService.rejectContent(id, reason);
      this.showSuccess('Content rejected successfully');
      this.loadContentQueue();
    } catch (error) {
      this.showError(error.message || 'Failed to reject content');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    if (this.contentContainer) {
      this.contentContainer.innerHTML = loading
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
  new ContentQueueController();
});

export default ContentQueueController;
