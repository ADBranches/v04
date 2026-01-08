// frontend/js/pages/bookings/booking-manage.js
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
                <div class="max-w-4xl mx-auto">
                    <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">Booking Management</h1>
                    
                    <!-- Messages -->
                    <div id="errorMessage" class="error-message hidden mb-6"></div>
                    <div id="successMessage" class="success-message hidden mb-6"></div>
                    
                    <!-- Booking Details Container -->
                    <div id="bookingContainer" class="bg-white rounded-2xl shadow-lg p-8">
                        <div class="text-center py-8">
                            <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p class="mt-4 text-gray-600">Loading booking details...</p>
                        </div>
                    </div>
                    
                    <!-- Back Link -->
                    <div class="text-center mt-6">
                        <a href="/bookings" data-link class="text-uganda-yellow hover:underline font-african">
                            ← Back to Bookings List
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    // This will be initialized by the controller
    console.log('📋 Booking management page rendered');
};

class BookingManageController {
  constructor() {
    this.bookingContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.notesForm = null;
    this.bookingId = null;
    this.init();
  }

  init() {
    if (!authService.isAuthenticated()) {
      router.navigate('/auth/login');
      return;
    }
    this.bookingId = parseInt(window.location.pathname.split('/').pop());
    this.bindElements();
    this.bindEvents();
    this.loadBooking();
  }

  bindElements() {
    this.bookingContainer = document.getElementById('bookingContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
    this.notesForm = document.getElementById('notesForm');
  }

  bindEvents() {
    if (this.notesForm) {
      this.notesForm.addEventListener('submit', (e) => this.handleNotesSubmit(e));
    }
  }

  async loadBooking() {
    this.setLoadingState(true);
    try {
      const response = await BookingService.getBooking(this.bookingId);
      this.renderBooking(response.booking);
    } catch (error) {
      this.showError(error.message || 'Failed to load booking');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderBooking(booking) {
    if (!this.bookingContainer) return;
    const userRole = authService.getCurrentUser()?.role;

    this.bookingContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Booking Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Destination:</strong> ${booking.destination.name}</p>
            <p><strong>Region:</strong> ${booking.destination.region}</p>
            <p><strong>Description:</strong> ${booking.destination.description.substring(0, 200)}...</p>
            <p><strong>Price Range:</strong> ${booking.destination.price_range}</p>
            <p><strong>Booked by:</strong> ${booking.user.name} (${booking.user.email})</p>
            <p><strong>Guide:</strong> ${booking.guide?.name || 'Unassigned'}</p>
            <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' })}</p>
            <p><strong>Status:</strong> <span class="${booking.status === 'pending' ? 'text-gray-600' : booking.status === 'confirmed' ? 'text-safari-forest' : 'text-uganda-red'}">${booking.status}</span></p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
        </div>
        <div class="flex space-x-2 mt-4">
          ${userRole === 'guide' && booking.status === 'pending' ? `
            <button onclick="new BookingManageController().confirmBooking(${booking.id})" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 font-african">Confirm</button>
            <button onclick="new BookingManageController().cancelBooking(${booking.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Cancel</button>
          ` : ''}
          ${userRole === 'user' && booking.status !== 'cancelled' ? `
            <button onclick="new BookingManageController().cancelBooking(${booking.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Cancel</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  async handleNotesSubmit(e) {
    e.preventDefault();
    this.setLoadingState(true, true);
    try {
      const formData = new FormData(this.notesForm);
      const notes = formData.get('notes').trim();
      await BookingService.updateBooking(this.bookingId, notes);
      this.showSuccess('Booking notes updated successfully');
      this.loadBooking();
    } catch (error) {
      this.showError(error.message || 'Failed to update notes');
    } finally {
      this.setLoadingState(false, true);
    }
  }

  async confirmBooking(id) {
    this.setLoadingState(true);
    try {
      await BookingService.confirmBooking(id);
      this.showSuccess('Booking confirmed successfully');
      this.loadBooking();
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
      this.loadBooking();
    } catch (error) {
      this.showError(error.message || 'Failed to cancel booking');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading, isForm = false) {
    if (isForm && this.notesForm) {
      const submitButton = this.notesForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = loading;
        submitButton.innerHTML = loading
          ? `<svg class="animate-spin h-5 w-5 text-uganda-black inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Updating...`
          : 'Update Notes';
        submitButton.className = loading
          ? 'bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg opacity-50 font-display'
          : 'bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display';
      }
    } else if (this.bookingContainer) {
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

export default BookingManageController;