// frontend/js/pages/moderation/pending-content.js
import AuthService from '../../services/auth-service.js';
import ModerationService from '../../services/moderation-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <div id="navigation"></div>
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">Pending Content Moderation</h1>
                
                <!-- Messages -->
                <div id="errorMessage" class="error-message hidden mb-6"></div>
                <div id="successMessage" class="success-message hidden mb-6"></div>
                
                <!-- Filters -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <form id="filterForm" class="flex flex-wrap gap-4 items-end">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                            <select name="content_type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="destination">Destinations</option>
                                <option value="guide">Guides</option>
                                <option value="booking">Bookings</option>
                            </select>
                        </div>
                        <button type="submit" 
                                class="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african">
                            Filter
                        </button>
                    </form>
                </div>
                
                <!-- Content Container -->
                <div id="contentContainer" class="mb-8">
                    <div class="text-center py-8">
                        <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-4 text-gray-600">Loading pending content...</p>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div id="paginationContainer"></div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new PendingContentController();
};

class PendingContentController {
  constructor() {
    this.contentContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.paginationContainer = null;
    this.filterForm = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated() || !AuthService.hasRole(['admin', 'auditor'])) {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadPendingContent();
  }

  bindElements() {
    this.contentContainer = document.getElementById('contentContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
    this.paginationContainer = document.getElementById('paginationContainer');
    this.filterForm = document.getElementById('filterForm');
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
      content_type: formData.get('content_type') || 'destination',
      page: 1,
      limit: 10,
    };
    await this.loadPendingContent(params);
  }

  async loadPendingContent(params = { content_type: 'destination', page: 1, limit: 10 }) {
    this.setLoadingState(true);
    try {
      const response = await ModerationService.getPendingContent(params);
      this.renderContent(response.moderationLogs, response.pagination);
    } catch (error) {
      this.showError(error.message || 'Failed to load pending content');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderContent(moderationLogs, pagination) {
    if (!this.contentContainer || !this.paginationContainer) return;

    this.contentContainer.innerHTML = moderationLogs.length === 0
      ? '<p class="text-gray-600 text-center py-8 font-african">No pending content available.</p>'
      : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${moderationLogs.map(log => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${log.destination.name}</h3>
                <p class="text-gray-600 mb-2">${log.destination.description.substring(0, 100)}...</p>
                <p class="text-sm text-gray-500">Submitted by: ${log.submitter.name}</p>
                <p class="text-sm text-gray-500">Region: ${log.destination.region}</p>
                <div class="flex space-x-2 mt-4">
                  <button onclick="router.navigate('/moderation/review/${log.id}')" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Review</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    this.paginationContainer.innerHTML = `
      <div class="flex justify-center space-x-2 mt-6">
        ${pagination.page > 1 ? `
          <button onclick="new PendingContentController().loadPendingContent({ page: ${pagination.page - 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Previous</button>
        ` : ''}
        <span class="px-4 py-2 text-uganda-black font-african">Page ${pagination.page} of ${pagination.pages}</span>
        ${pagination.page < pagination.pages ? `
          <button onclick="new PendingContentController().loadPendingContent({ page: ${pagination.page + 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Next</button>
        ` : ''}
      </div>
    `;
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

export default PendingContentController;
