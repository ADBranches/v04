// frontend/js/pages/admin/system-analytics.js
import AuthService from '../../services/auth-service.js';
import AdminService from '../../services/admin-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

class SystemAnalyticsController {
  constructor() {
    this.analyticsContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.init();
  }

  init() {
    const user = AuthService.getCurrentUser ? AuthService.getCurrentUser() : AuthService.getUser();
    if (!AuthService.isAuthenticated() || (user?.role !== 'admin' && !AuthService.hasRole?.(['admin']))) {
        router.navigate('/auth/login');
        return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadAnalytics();
  }

  bindElements() {
    this.analyticsContainer = document.getElementById('analyticsContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
  }

  bindEvents() {
    // Add event listeners for interactive elements (e.g., refresh button)
    const refreshButton = document.getElementById('refreshAnalytics');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => this.loadAnalytics());
    }
    }

  async loadAnalytics() {
    this.setLoadingState(true);
    try {
        const response = await AdminService.getAnalytics();
        
        // Handle different response structures
        const analyticsData = response.analytics || response.data || response;
        
        if (!analyticsData) {
        throw new Error('No analytics data received');
        }
        
        this.renderAnalytics(analyticsData);
    } catch (error) {
        console.error('Analytics loading error:', error);
        this.showError(error.message || 'Failed to load analytics data');
        
        // Show fallback empty state
        if (this.analyticsContainer) {
        this.analyticsContainer.innerHTML = `
            <div class="text-center py-12">
            <div class="text-uganda-red text-6xl mb-4">📊</div>
            <h3 class="text-lg font-semibold text-uganda-black mb-2">Unable to Load Analytics</h3>
            <p class="text-gray-600 mb-4">${error.message || 'Please try again later'}</p>
            <button onclick="location.reload()" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display">
                Retry
            </button>
            </div>
        `;
        }
    } finally {
        this.setLoadingState(false);
    }
}

  renderAnalytics(analytics) {
    if (!this.analyticsContainer) return;

    // Handle different analytics data structures
    const overview = analytics.overview || analytics;
    const bookingsByRegion = analytics.bookingsByRegion || [];
    const usersByRole = analytics.users || [];
    const destinationsByStatus = analytics.destinations || [];
    const bookingsByStatus = analytics.bookings || [];

    // Process region stats for display
    const regionStats = Array.isArray(bookingsByRegion) 
        ? bookingsByRegion.reduce((acc, stat) => {
            const regionName = stat.region || stat.name;
            const count = stat.count || stat.bookingCount || stat.total;
            if (regionName && count) {
            acc[regionName] = (acc[regionName] || 0) + parseInt(count);
            }
            return acc;
        }, {})
        : bookingsByRegion;

    this.analyticsContainer.innerHTML = `
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 class="text-lg font-semibold font-display text-uganda-black">Total Users</h3>
            <p class="text-3xl font-bold text-safari-forest">${overview.total_users || overview.totalUsers || 0}</p>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 class="text-lg font-semibold font-display text-uganda-black">Total Bookings</h3>
            <p class="text-3xl font-bold text-safari-forest">${overview.total_bookings || overview.totalBookings || 0}</p>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 class="text-lg font-semibold font-display text-uganda-black">Total Destinations</h3>
            <p class="text-3xl font-bold text-safari-forest">${overview.total_destinations || overview.totalDestinations || 0}</p>
        </div>
        <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 class="text-lg font-semibold font-display text-uganda-black">Pending Moderations</h3>
            <p class="text-3xl font-bold text-safari-forest">${overview.pending_moderations || overview.pendingModerations || 0}</p>
        </div>
        </div>

        <!-- Detailed Stats Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Users by Role -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="text-lg font-semibold font-display text-uganda-black mb-4">Users by Role</h3>
            <div class="space-y-3">
            ${usersByRole.map(userStat => `
                <div class="flex items-center justify-between p-3 bg-safari-sand/20 rounded-lg">
                <span class="text-uganda-black font-african capitalize">${userStat.role || userStat.name}</span>
                <span class="text-uganda-yellow font-bold">${userStat.count || userStat.total || 0}</span>
                </div>
            `).join('')}
            </div>
        </div>

        <!-- Destinations by Status -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="text-lg font-semibold font-display text-uganda-black mb-4">Destinations by Status</h3>
            <div class="space-y-3">
            ${destinationsByStatus.map(destStat => `
                <div class="flex items-center justify-between p-3 bg-safari-sand/20 rounded-lg">
                <span class="text-uganda-black font-african capitalize">${destStat.status || destStat.name}</span>
                <span class="text-uganda-yellow font-bold">${destStat.count || destStat.total || 0}</span>
                </div>
            `).join('')}
            </div>
        </div>
        </div>

        <!-- Bookings by Region -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold font-display text-uganda-black">Bookings by Region</h3>
            <button id="refreshAnalytics" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display text-sm">
            Refresh Data
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${Object.entries(regionStats).map(([region, count]) => `
            <div class="flex items-center justify-between p-4 bg-safari-sand/20 rounded-lg">
                <span class="text-uganda-black font-african">${region} ${region.includes('Uganda') ? '' : 'Uganda'}</span>
                <span class="text-uganda-yellow font-bold">${count} Bookings</span>
            </div>
            `).join('')}
            ${Object.keys(regionStats).length === 0 ? `
            <div class="col-span-2 text-center py-8 text-gray-500">
                No regional booking data available
            </div>
            ` : ''}
        </div>
        </div>
    `;

    // Re-bind events after rendering
    this.bindEvents();
    }

  setLoadingState(loading) {
    if (this.analyticsContainer) {
      this.analyticsContainer.innerHTML = loading
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
  new SystemAnalyticsController();
});

export default SystemAnalyticsController;