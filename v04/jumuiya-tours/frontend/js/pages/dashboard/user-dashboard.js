// frontend/js/pages/dashboard/user-dashboard.js
import authService from '../../services/auth-service.js';
import DestinationService from '../../services/destination-service.js';
import router from '../../app/router.js';


export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <!-- Navigation -->
            <div id="navigation"></div>
            
            <!-- Main Content -->
            <div class="container mx-auto px-4 py-8">
                <div id="errorMessage" class="error-message hidden mb-6"></div>
                
                <!-- Welcome Section -->
                <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <h1 class="text-3xl font-bold font-display text-uganda-black mb-2">Welcome to Your Dashboard</h1>
                    <p class="text-gray-600">Manage your tours and explore Uganda's beauty</p>
                </div>
                
                <!-- Featured Destinations -->
                <div id="dashboardContainer" class="bg-white rounded-2xl shadow-lg p-8">
                    <div class="text-center py-8">
                        <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new UserDashboardController();
};

class UserDashboardController {
  constructor() {
    this.dashboardContainer = null;
    this.errorMessage = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated()) {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.loadFeaturedDestinations();
  }

  bindElements() {
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  async loadFeaturedDestinations() {
    this.setLoadingState(true);
    try {
      const response = await DestinationService.getDestinations({ featured: true, limit: 6 });
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
      <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Featured Uganda Destinations</h2>
      ${destinations.length === 0 ? `
        <p class="text-gray-600">No featured destinations available.</p>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${destinations.map(dest => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <img src="${dest.images?.[0] || '/images/uganda-placeholder.jpg'}" alt="${dest.name}" class="w-full h-48 object-cover rounded-t-lg">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${dest.name}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${dest.short_description || 'Explore this amazing destination.'}</p>
                <p class="text-sm text-uganda-yellow font-semibold">Price: ${dest.price_range}</p>
                <button onclick="router.navigate('/destinations/${dest.id}')" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 mt-4 font-african">View Details</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
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
      this.errorMessage.className = 'error-message visible bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg';
    }
  }
}

export default UserDashboardController;
