// frontend/js/pages/dashboard/admin-dashboard.js
import authService from '../../services/auth-service.js';
import DestinationService from '../../services/destination-service.js';
import GuideService from '../../services/guide-service.js';
import router from '../../app/router.js';

class AdminDashboardController {
  constructor() {
    this.dashboardContainer = null;
    this.errorMessage = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated() || authService.getCurrentUser().role !== 'admin') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.loadPendingDestinations();
    this.loadPendingVerifications(); // Load guide verifications
  }

  bindElements() {
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  async loadPendingDestinations() {
    this.setLoadingState(true);
    try {
      const response = await DestinationService.getPendingDestinations({ limit: 10 });
      this.renderDestinations(response.destinations);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  // ===== GUIDE VERIFICATION SECTION - ADDED =====
  async loadPendingVerifications() {
    try {
      const response = await GuideService.getPendingVerifications({ limit: 10 });
      this.renderVerifications(response.pending_applications || response.verifications || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
      this.showError('Failed to load pending verifications');
    }
  }

  renderVerifications(verifications) {
    if (!this.dashboardContainer || verifications.length === 0) return;

    const verificationsHTML = `
      <div class="mt-12">
        <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Pending Guide Verifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${verifications.map(ver => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-uganda-yellow">
              <div class="p-6">
                <div class="flex items-center space-x-3 mb-4">
                  <div class="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center">
                    <span class="text-uganda-black font-bold text-lg">${ver.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold font-display text-uganda-black">${ver.name || 'Unknown User'}</h3>
                    <p class="text-sm text-gray-600">${ver.email || ''}</p>
                  </div>
                </div>
                <p class="text-gray-600 mb-4">Applied: ${new Date(ver.verification_submitted_at).toLocaleDateString()}</p>
                <p class="text-sm text-uganda-red font-medium">Status: ${ver.guide_status || 'pending'}</p>
                <div class="mt-4 flex space-x-2 flex-wrap gap-2">
                  <button onclick="router.navigate('/guides/verifications/${ver.id}')" 
                          class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african text-sm">
                    View Details
                  </button>
                  <button onclick="new AdminDashboardController().approveVerification(${ver.id})" 
                          class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 font-african text-sm">
                    Approve
                  </button>
                  <button onclick="new AdminDashboardController().rejectVerification(${ver.id})" 
                          class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african text-sm">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        ${verifications.length === 0 ? `
          <p class="text-gray-600 text-center py-8">No pending guide verifications.</p>
        ` : ''}
      </div>
    `;

    // Append verifications to dashboard container
    this.dashboardContainer.insertAdjacentHTML('beforeend', verificationsHTML);
  }

  async approveVerification(id) {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await GuideService.approveVerification(id, notes || '');
      this.showSuccess('Guide verification approved successfully');
      this.refreshDashboard();
    } catch (error) {
      this.showError(error.message || 'Failed to approve verification');
    }
  }

  async rejectVerification(id) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      this.showError('Rejection reason is required');
      return;
    }
    try {
      await GuideService.rejectVerification(id, reason);
      this.showSuccess('Guide verification rejected successfully');
      this.refreshDashboard();
    } catch (error) {
      this.showError(error.message || 'Failed to reject verification');
    }
  }
  // ===== END GUIDE VERIFICATION SECTION =====

  async refreshDashboard() {
    // Clear and reload both sections
    this.dashboardContainer.innerHTML = '';
    await this.loadPendingDestinations();
    await this.loadPendingVerifications();
  }

  renderDestinations(destinations) {
    if (!this.dashboardContainer) return;

    this.dashboardContainer.innerHTML = `
      <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Pending Destinations</h2>
      <div class="mb-6">
        <a href="/destinations/create" data-link class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Create New Destination</a>
      </div>
      ${destinations.length === 0 ? `
        <p class="text-gray-600">No pending destinations to review.</p>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${destinations.map(dest => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <img src="${dest.images?.[0] || '/images/uganda-placeholder.jpg'}" alt="${dest.name}" class="w-full h-48 object-cover rounded-t-lg">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${dest.name}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${dest.short_description || 'Awaiting review.'}</p>
                <p class="text-sm text-uganda-red">Status: ${dest.status}</p>
                <div class="mt-4 flex space-x-2">
                  <button onclick="router.navigate('/destinations/${dest.id}')" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">View</button>
                  <button onclick="new AdminDashboardController().approveDestination(${dest.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 font-african">Approve</button>
                  <button onclick="new AdminDashboardController().rejectDestination(${dest.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Reject</button>
                  <button onclick="new AdminDashboardController().${dest.featured ? 'unfeature' : 'feature'}Destination(${dest.id})" class="bg-safari-earth text-white px-4 py-2 rounded-lg hover:bg-yellow-800 font-african">${dest.featured ? 'Unfeature' : 'Feature'}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  async approveDestination(id) {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await DestinationService.approveDestination(id, notes || '');
      this.showSuccess('Destination approved successfully');
      this.loadPendingDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async rejectDestination(id) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      this.showError('Rejection reason is required');
      return;
    }
    try {
      await DestinationService.rejectDestination(id, reason);
      this.showSuccess('Destination rejected successfully');
      this.loadPendingDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async featureDestination(id) {
    try {
      await DestinationService.featureDestination(id);
      this.showSuccess('Destination featured successfully');
      this.loadPendingDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async unfeatureDestination(id) {
    try {
      await DestinationService.unfeatureDestination(id);
      this.showSuccess('Destination unfeatured successfully');
      this.loadPendingDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  setLoadingState(loading) {
    if (this.dashboardContainer) {
      if (loading) {
        this.dashboardContainer.innerHTML = `
          <div class="text-center py-8">
            <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        `;
      }
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg';
    }
  }

  showSuccess(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'success-message visible bg-safari-forest/10 border border-safari-forest text-safari-forest px-4 py-3 rounded-lg';
      setTimeout(() => {
        this.errorMessage.className = 'success-message hidden';
      }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboardController();
});

export default AdminDashboardController;