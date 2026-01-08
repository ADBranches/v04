// frontend/js/pages/bookings/booking-list.js
import authService from '../../services/auth-service.js';
import BookingService from '../../services/booking-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <!-- Navigation -->
            <div id="navigation"></div>
            
            <!-- Main Content -->
            <div class="container mx-auto px-4 py-8">
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-3xl font-bold font-display text-uganda-black">My Bookings</h1>
                    <button onclick="router.navigate('/bookings/create')" 
                            class="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african">
                        New Booking
                    </button>
                </div>
                
                <!-- Messages -->
                <div id="errorMessage" class="error-message hidden mb-6"></div>
                <div id="successMessage" class="success-message hidden mb-6"></div>
                
                <!-- Filters -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <form id="filterForm" class="flex flex-wrap gap-4 items-end">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <button type="submit" 
                                class="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african">
                            Filter
                        </button>
                    </form>
                </div>
                
                <!-- Bookings Container -->
                <div id="bookingContainer" class="mb-8">
                    <div class="text-center py-8">
                        <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div id="paginationContainer"></div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new BookingListController();
};

class BookingListController {
  constructor() {
    this.bookingContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.paginationContainer = null;
    this.filterForm = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated()) {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadBookings();
  }

  bindElements() {
    this.bookingContainer = document.getElementById('bookingContainer');
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
      status: formData.get('status'),
      page: 1,
      limit: 10,
    };
    await this.loadBookings(params);
  }

  async loadBookings(params = { page: 1, limit: 10 }) {
    this.setLoadingState(true);
    try {
      const response = await BookingService.getBookings(params);
      this.renderBookings(response.bookings, response.pagination);
    } catch (error) {
      this.showError(error.message || 'Failed to load bookings');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderBookings(bookings, pagination) {
    if (!this.bookingContainer || !this.paginationContainer) return;

    const userRole = authService.getCurrentUser()?.role;
    this.bookingContainer.innerHTML = bookings.length === 0
      ? '<p class="text-gray-600 text-center py-8 font-african">No bookings available.</p>'
      : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${bookings.map(booking => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${booking.destination.name}</h3>
                <p class="text-gray-600 mb-2">Region: ${booking.destination.region}</p>
                <p class="text-sm text-gray-500">Booked by: ${booking.user.name}</p>
                <p class="text-sm text-gray-500">Guide: ${booking.guide?.name || 'Unassigned'}</p>
                <p class="text-sm text-gray-500">Date: ${new Date(booking.booking_date).toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' })}</p>
                <p class="text-sm ${booking.status === 'pending' ? 'text-gray-600' : booking.status === 'confirmed' ? 'text-safari-forest' : 'text-uganda-red'}">Status: ${booking.status}</p>
                ${booking.notes ? `<p class="text-sm text-gray-500 mt-2">Notes: ${booking.notes}</p>` : ''}
                <div class="flex space-x-2 mt-4">
                  <button onclick="router.navigate('/bookings/manage/${booking.id}')" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">View</button>
                  ${userRole === 'guide' && booking.status === 'pending' ? `
                    <button onclick="new BookingListController().confirmBooking(${booking.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 font-african">Confirm</button>
                    <button onclick="new BookingListController().cancelBooking(${booking.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Cancel</button>
                  ` : ''}
                  ${userRole === 'user' && booking.status !== 'cancelled' ? `
                    <button onclick="new BookingListController().cancelBooking(${booking.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Cancel</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    this.paginationContainer.innerHTML = `
      <div class="flex justify-center space-x-2 mt-6">
        ${pagination.page > 1 ? `
          <button onclick="new BookingListController().loadBookings({ page: ${pagination.page - 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Previous</button>
        ` : ''}
        <span class="px-4 py-2 text-uganda-black font-african">Page ${pagination.page} of ${pagination.pages}</span>
        ${pagination.page < pagination.pages ? `
          <button onclick="new BookingListController().loadBookings({ page: ${pagination.page + 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Next</button>
        ` : ''}
      </div>
    `;
  }

  async confirmBooking(id) {
    this.setLoadingState(true);
    try {
      await BookingService.confirmBooking(id);
      this.showSuccess('Booking confirmed successfully');
      this.loadBookings();
    } catch (error) {
      this.showError(error.message || 'Failed to confirm booking');
    } finally {
      this.setLoadingState(false);
    }
  }

  async cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    this.setLoadingState(true);
    try {
      await BookingService.cancelBooking(id);
      this.showSuccess('Booking cancelled successfully');
      this.loadBookings();
    } catch (error) {
      this.showError(error.message || 'Failed to cancel booking');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    if (this.bookingContainer) {
      this.bookingContainer.innerHTML = loading
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

export default BookingListController;