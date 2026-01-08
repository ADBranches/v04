// frontend/js/pages/dashboard/guide-dashboard.js
import authService from '../../services/auth-service.js';
import DestinationService from '../../services/destination-service.js';
import router from '../../app/router.js';

class GuideDashboardController {
  constructor() {
    this.dashboardContainer = null;
    this.errorMessage = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated() || authService.getCurrentUser().role !== 'guide') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.loadDestinations();
  }

  bindElements() {
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  async loadDestinations() {
    this.setLoadingState(true);
    try {
      const response = await DestinationService.getDestinations({ created_by: authService.getCurrentUser().id });
      this.renderDestinations(response.destinations);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  renderDestinations(destinations) {
    if (!this.dashboardContainer) return;

    this.dashboardContainer.innerHTML = `
      <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">My Destinations</h2>
      <div class="mb-6">
        <a href="/destinations/create" data-link class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Create New Destination</a>
      </div>
      ${destinations.length === 0 ? `
        <p class="text-gray-600">You haven't created any destinations yet.</p>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${destinations.map(dest => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <img src="${dest.images?.[0] || '/images/uganda-placeholder.jpg'}" alt="${dest.name}" class="w-full h-48 object-cover rounded-t-lg">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${dest.name}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${dest.short_description || 'Explore this destination.'}</p>
                <p class="text-sm text-uganda-red">Status: ${dest.status}</p>
                <div class="mt-4 flex space-x-2">
                  <button onclick="router.navigate('/destinations/${dest.id}')" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">View</button>
                  <button onclick="router.navigate('/destinations/edit/${dest.id}')" class="bg-safari-savanna text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Edit</button>
                  <button onclick="new GuideDashboardController().deleteDestination(${dest.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Delete</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  async deleteDestination(id) {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      await DestinationService.deleteDestination(id);
      this.showSuccess('Destination deleted successfully');
      this.loadDestinations();
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
  new GuideDashboardController();
});

export default GuideDashboardController;
