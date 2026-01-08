// frontend/js/pages/destinations/destination-view.js
import destinationService from '../../services/destination-service.js';
import authService from '../../services/auth-service.js';
import router from '../../app/router.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <!-- Navigation -->
            <div id="navigation"></div>
            
            <!-- Main Content -->
            <div class="container mx-auto px-4 py-8">
                <div class="max-w-4xl mx-auto">
                    <!-- Messages -->
                    <div id="errorMessage" class="error-message hidden mb-6"></div>
                    <div id="successMessage" class="success-message hidden mb-6"></div>
                    
                    <!-- Destination Container -->
                    <div id="destinationContainer">
                        <div class="text-center py-8">
                            <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p class="mt-4 text-gray-600">Loading destination details...</p>
                        </div>
                    </div>
                    
                    <!-- Back Link -->
                    <div class="text-center mt-6">
                        <a href="/destinations" data-link class="text-uganda-yellow hover:underline font-african">
                            ← Back to Destinations
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new DestinationViewController();
};

class DestinationViewController {
  constructor() {
    this.destinationContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.destinationId = null;

    this.init();
  }

  init() {
    const path = window.location.pathname;
    this.destinationId = parseInt(path.split('/').pop());
    this.bindElements();
    this.bindEvents();
    this.loadDestination();
  }

  bindElements() {
    this.destinationContainer = document.getElementById('destinationContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'bookButton') {
        router.navigate(`/bookings/create/${this.destinationId}`);
      } else if (e.target.id === 'editButton') {
        router.navigate(`/destinations/edit/${this.destinationId}`);
      } else if (e.target.id === 'deleteButton') {
        this.deleteDestination();
      } else if (e.target.id === 'approveButton') {
        this.approveDestination();
      } else if (e.target.id === 'rejectButton') {
        this.rejectDestination();
      } else if (e.target.id === 'featureButton') {
        this.featureDestination();
      } else if (e.target.id === 'unfeatureButton') {
        this.unfeatureDestination();
      }
    });
  }

  async loadDestination() {
    this.setLoadingState(true);
    try {
      const response = await destinationService.getDestination(this.destinationId);
      this.renderDestination(response.destination);
    } catch (error) {
      this.showError(error.message);
      router.navigate('/destinations');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderDestination(dest) {
    if (!this.destinationContainer) return;

    const user = authService.getUser();
    const isAdminOrAuditor = user && ['admin', 'auditor'].includes(user.role);
    const isGuide = user && user.role === 'guide';
    const canEdit = isAdminOrAuditor || (isGuide && dest.created_by === user?.id);

    // In renderDestination (destination-view.js)
    this.destinationContainer.innerHTML = `
        <div class="bg-white rounded-2xl shadow-md p-6">
            <img src="${dest.images?.[0] || '/images/placeholder.jpg'}" alt="${dest.name}" class="w-full h-64 object-cover rounded-t-lg mb-4">
            <h1 class="text-2xl font-bold font-display text-uganda-black mb-2">${dest.name}</h1>
            <p class="text-gray-600 mb-4">${dest.description}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <p><strong>Location:</strong> ${dest.location}</p>
                <p><strong>Region:</strong> ${dest.region}</p>
                <p><strong>Price Range:</strong> ${dest.price_range}</p>
                <p><strong>Duration:</strong> ${dest.duration}</p>
                <p><strong>Difficulty:</strong> ${dest.difficulty_level}</p>
                <p><strong>Best Season:</strong> ${dest.best_season}</p>
            </div>
            <div>
                <p><strong>Highlights:</strong></p>
                <ul class="list-disc list-inside">${dest.highlights?.map((h) => `<li>${h}</li>`).join('') || 'None'}</ul>
                <p><strong>Included:</strong></p>
                <ul class="list-disc list-inside">${dest.included?.map((i) => `<li>${i}</li>`).join('') || 'None'}</ul>
                <p><strong>Not Included:</strong></p>
                <ul class="list-disc list-inside">${dest.not_included?.map((i) => `<li>${i}</li>`).join('') || 'None'}</ul>
                <p><strong>Requirements:</strong> ${dest.requirements || 'None'}</p>
            </div>
            </div>
            ${dest.status !== 'approved' ? `<p class="text-uganda-red mt-4">Status: ${dest.status}</p>` : ''}
            ${dest.featured ? '<span class="inline-block bg-uganda-yellow/20 text-uganda-yellow px-2 py-1 text-xs rounded-full mt-4">Featured</span>' : ''}
            <div class="mt-6 flex space-x-4">
            ${authService.isAuthenticated() && dest.status === 'approved' ? '<button id="bookButton" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400">Book Now</button>' : ''}
            ${canEdit ? `<button id="editButton" class="bg-safari-savanna text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400">Edit</button>` : ''}
            ${canEdit ? `<button id="deleteButton" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red">Delete</button>` : ''}
            ${
                isAdminOrAuditor && dest.status === 'pending'
                ? `
                    <button id="approveButton" class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600">Approve</button>
                    <button id="rejectButton" class="bg-uganda-dark-red text-white px-4 py-2 rounded-lg hover:bg-red-700">Reject</button>
                `
                : ''
            }
            ${
                isAdminOrAuditor
                ? `
                    <button id="${dest.featured ? 'unfeatureButton' : 'featureButton'}" class="bg-safari-earth text-white px-4 py-2 rounded-lg hover:bg-yellow-800">${dest.featured ? 'Unfeature' : 'Feature'}</button>
                `
                : ''
            }
            </div>
        </div>
    `;
  }

  async deleteDestination() {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      await destinationService.deleteDestination(this.destinationId);
      this.showSuccess('Destination deleted successfully');
      setTimeout(() => router.navigate('/destinations'), 2000);
    } catch (error) {
      this.showError(error.message);
    }
  }

  async approveDestination() {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await destinationService.approveDestination(this.destinationId, notes || '');
      this.showSuccess('Destination approved successfully');
      this.loadDestination();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async rejectDestination() {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      this.showError('Rejection reason is required');
      return;
    }
    try {
      await destinationService.rejectDestination(this.destinationId, reason);
      this.showSuccess('Destination rejected successfully');
      this.loadDestination();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async featureDestination() {
    try {
      await destinationService.featureDestination(this.destinationId);
      this.showSuccess('Destination featured successfully');
      this.loadDestination();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async unfeatureDestination() {
    try {
      await destinationService.unfeatureDestination(this.destinationId);
      this.showSuccess('Destination unfeatured successfully');
      this.loadDestination();
    } catch (error) {
      this.showError(error.message);
    }
  }

  setLoadingState(loading) {
    if (this.destinationContainer) {
      this.destinationContainer.innerHTML = loading
        ? '<div class="text-center py-4"><svg class="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>'
        : '';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg';
    }
  }

  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.textContent = message;
      this.successMessage.className = 'success-message visible bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
      setTimeout(() => {
        this.successMessage.className = 'success-message hidden';
      }, 3000);
    }
  }
}

export default DestinationViewController;
