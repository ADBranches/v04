// frontend/js/pages/bookings/booking-create.js
import authService from '../../services/auth-service.js';
import BookingService from '../../services/booking-service.js';
import DestinationService from '../../services/destination-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';


export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <!-- Navigation -->
            <div id="navigation"></div>
            
            <!-- Main Content -->
            <div class="container mx-auto px-4 py-8">
                <div class="max-w-2xl mx-auto">
                    <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">Create New Booking</h1>
                    
                    <!-- Messages -->
                    <div id="errorMessage" class="error-message hidden mb-6"></div>
                    <div id="successMessage" class="success-message hidden mb-6"></div>
                    
                    <!-- Booking Form -->
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <form id="bookingForm" class="space-y-6">
                            <!-- Region Filter -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Region</label>
                                <select id="region" name="region" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                    <option value="">All Regions</option>
                                    <option value="Central">Central Uganda</option>
                                    <option value="Northern">Northern Uganda</option>
                                    <option value="Western">Western Uganda</option>
                                    <option value="Eastern">Eastern Uganda</option>
                                </select>
                            </div>
                            
                            <!-- Destination Selection -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                                <select id="destination_id" name="destination_id" required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                    <option value="">Select a destination</option>
                                </select>
                            </div>
                            
                            <!-- Booking Date -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Booking Date *</label>
                                <input type="date" id="booking_date" name="booking_date" required
                                       min="${new Date().toISOString().split('T')[0]}"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                            </div>
                            
                            <!-- Notes -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                                <textarea id="notes" name="notes" rows="4"
                                          placeholder="Any special requirements or preferences..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                            </div>
                            
                            <!-- Submit Button -->
                            <button type="submit" 
                                    class="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-display">
                                Create Booking
                            </button>
                        </form>
                    </div>
                    
                    <!-- Back Link -->
                    <div class="text-center mt-6">
                        <a href="/bookings" data-link class="text-uganda-yellow hover:underline font-african">
                            ← Back to My Bookings
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new BookingCreateController();
};

class BookingCreateController {
  constructor() {
    this.form = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.destinationSelect = null;
    this.regionSelect = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated() || authService.getCurrentUser().role !== 'user') {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadRegions();
    this.loadDestinations();
  }

  bindElements() {
    this.form = document.getElementById('bookingForm');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
    this.destinationSelect = document.getElementById('destination_id');
    this.regionSelect = document.getElementById('region'); // Add this line
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    if (this.regionSelect) {
      this.regionSelect.addEventListener('change', () => this.loadDestinations());
    }
  }
  loadRegions() {
    const regions = ['Central', 'Northern', 'Western', 'Eastern'];
    if (this.regionSelect) {
      this.regionSelect.innerHTML = `
        <option value="">All Regions</option>
        ${regions.map(region => `
          <option value="${region}">${region} Uganda</option>
        `).join('')}
      `;
    }
  }

  async loadDestinations() {
    try {

      const params = { featured: true };
      // Add region filtering:
      if (this.regionSelect?.value) {
          params.region = this.regionSelect.value;
        }
      const response = await DestinationService.getDestinations({ featured: true });
      this.renderDestinations(response.destinations);
    } catch (error) {
      this.showError('Failed to load destinations');
    }
  }

  renderDestinations(destinations) {
    if (!this.destinationSelect) return;
    this.destinationSelect.innerHTML = `
      <option value="">Select a destination</option>
      ${destinations.map(dest => `
        <option value="${dest.id}">${dest.name} (${dest.district ? `${dest.disy}, ` : ''}) (${dest.region}) - ${dest.price_range}</option>
      `).join('')}
    `;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.setLoadingState(true);
    try {
      const formData = new FormData(this.form);
      const data = {
        destination_id: parseInt(formData.get('destination_id')),
        booking_date: formData.get('booking_date'),
        notes: formData.get('notes').trim(),
      };
      await BookingService.createBooking(data);
      this.showSuccess('Booking created successfully. Awaiting guide confirmation.');
      setTimeout(() => router.navigate('/bookings'), 2000);
    } catch (error) {
      this.showError(error.message || 'Failed to create booking');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    const submitButton = this.form?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.innerHTML = loading
        ? `<svg class="animate-spin h-5 w-5 text-uganda-black inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Submitting...`
        : 'Create Booking';
      submitButton.className = loading
        ? 'bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg opacity-50 font-display'
        : 'bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display';
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

export default BookingCreateController;