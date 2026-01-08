// frontend/js/pages/dashboard/auditor-dashboard.js
import authService from '../../services/auth-service.js';
import DestinationService from '../../services/destination-service.js';
import GuideService from '../../services/guide-service.js';
import router from '../../app/router.js';

class AuditorDashboardController {
  constructor() {
    this.dashboardContainer = null;
    this.errorMessage = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated() || authService.getCurrentUser().role !== 'auditor') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.loadDashboardData();
  }

  bindElements() {
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  async loadDashboardData() {
    this.setLoadingState(true);
    try {
      await Promise.all([
        this.loadPendingDestinations(),
        this.loadPendingVerifications()
      ]);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  async loadPendingDestinations() {
    try {
      const response = await DestinationService.getPendingDestinations({ limit: 10 });
      this.renderDestinations(response.destinations);
    } catch (error) {
      this.showError(`Failed to load destinations: ${error.message}`);
    }
  }

  async loadPendingVerifications() {
    try {
      const response = await GuideService.getVerifications({ limit: 10 });
      this.renderVerifications(response.verifications);
    } catch (error) {
      this.showError(`Failed to load verifications: ${error.message}`);
    }
  }

  renderDestinations(destinations) {
    if (!this.dashboardContainer) return;

    this.dashboardContainer.innerHTML = `
      <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Pending Destinations for Review</h2>
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
                  <button onclick="new AuditorDashboardController().approveDestination(${dest.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 font-african">Approve</button>
                  <button onclick="new AuditorDashboardController().rejectDestination(${dest.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Reject</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  renderVerifications(verifications) {
    if (!this.dashboardContainer) return;

    this.dashboardContainer.innerHTML += `
      <h2 class="text-2xl font-bold font-display text-uganda-black mt-8 mb-4">Pending Verifications</h2>
      ${verifications.length === 0 ? `
        <p class="text-gray-600">No pending verifications.</p>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${verifications.map(ver => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${ver.user.name}</h3>
                <p class="text-gray-600 mb-4">Status: ${ver.status}</p>
                <div class="flex space-x-2">
                  <button onclick="router.navigate('/guides/verifications/${ver.id}')" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">View</button>
                  <button onclick="new AuditorDashboardController().approveVerification(${ver.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 font-african">Approve</button>
                  <button onclick="new AuditorDashboardController().rejectVerification(${ver.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Reject</button>
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
      this.loadDashboardData();
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
      this.loadDashboardData();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async approveVerification(id) {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await GuideService.approveVerification(id, notes || '');
      this.showSuccess('Verification approved successfully');
      this.loadDashboardData();
    } catch (error) {
      this.showError(error.message);
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
      this.showSuccess('Verification rejected successfully');
      this.loadDashboardData();
    } catch (error) {
      this.showError(error.message);
    }
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
  new AuditorDashboardController();
});

export default AuditorDashboardController;