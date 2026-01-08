// frontend/js/pages/destinations/destination-list.js
import destinationService from '../../services/destination-service.js';
import authService from '../../services/auth-service.js';
import router from '../../app/router.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <div id="navigation"></div>
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">Explore Uganda Destinations</h1>
                
                <!-- Error Message -->
                <div id="errorMessage" class="error-message hidden mb-6"></div>
                
                <!-- Filters -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <form id="destinationFilterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <!-- Search -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input type="text" id="search" name="search" 
                                   placeholder="Search destinations..."
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                        </div>
                        
                        <!-- Region -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Region</label>
                            <select id="region" name="region" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="">All Regions</option>
                                <option value="Central">Central Uganda</option>
                                <option value="Northern">Northern Uganda</option>
                                <option value="Western">Western Uganda</option>
                                <option value="Eastern">Eastern Uganda</option>
                            </select>
                        </div>
                        
                        <!-- Difficulty -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                            <select id="difficulty" name="difficulty" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="">All Levels</option>
                                <option value="Easy">Easy</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Challenging">Challenging</option>
                                <option value="Difficult">Difficult</option>
                            </select>
                        </div>
                        
                        <!-- Sort -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select id="sort" name="sort" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="created_at">Newest First</option>
                                <option value="name">Name A-Z</option>
                                <option value="price_range">Price</option>
                            </select>
                        </div>
                        
                        <!-- Featured Filter -->
                        <div class="flex items-center">
                            <input type="checkbox" id="featured" name="featured" 
                                   class="h-4 w-4 text-uganda-yellow focus:ring-uganda-yellow border-gray-300 rounded">
                            <label for="featured" class="ml-2 text-sm text-gray-700">Featured Only</label>
                        </div>
                        
                        <!-- Order -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Order</label>
                            <select id="order" name="order" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="md:col-span-2 lg:col-span-4 flex justify-end">
                            <button type="submit" 
                                    class="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african">
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Destinations Grid -->
                <div id="destinationsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div class="text-center py-8 col-span-full">
                        <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-4 text-gray-600">Loading destinations...</p>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div id="paginationContainer" class="flex justify-center"></div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new DestinationListController();
};

class DestinationListController {
  constructor() {
    this.filterForm = null;
    this.destinationsContainer = null;
    this.paginationContainer = null;
    this.errorMessage = null;
    this.filters = {
      page: 1,
      limit: 12,
      region: '',
      difficulty: '',
      featured: false,
      search: '',
      sort: 'created_at',
      order: 'desc',
    };

    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadDestinations();
  }

  bindElements() {
    this.filterForm = document.getElementById('destinationFilterForm');
    this.destinationsContainer = document.getElementById('destinationsContainer');
    this.paginationContainer = document.getElementById('paginationContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  bindEvents() {
    if (this.filterForm) {
      this.filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.filters.page = 1;
        this.updateFilters();
        this.loadDestinations();
      });

      // Real-time search
      const searchInput = this.filterForm.querySelector('#search');
      searchInput.addEventListener('input', () => {
        this.filters.search = searchInput.value.trim();
        this.filters.page = 1;
        this.loadDestinations();
      });

      // Filter inputs
      ['region', 'difficulty', 'featured', 'sort', 'order'].forEach((field) => {
        const input = this.filterForm.querySelector(`#${field}`);
        if (input) {
          input.addEventListener('change', () => {
            this.filters[field] = input.type === 'checkbox' ? input.checked : input.value;
            this.filters.page = 1;
            this.loadDestinations();
          });
        }
      });
    }

    // Pagination
    this.paginationContainer?.addEventListener('click', (e) => {
      const pageButton = e.target.closest('[data-page]');
      if (pageButton) {
        this.filters.page = parseInt(pageButton.dataset.page);
        this.loadDestinations();
      }
    });
  }

  async loadDestinations() {
    this.setLoadingState(true);
    try {
      const response = await destinationService.getDestinations(this.filters);
      this.renderDestinations(response.destinations);
      this.renderPagination(response.pagination);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  renderDestinations(destinations) {
    if (!this.destinationsContainer) return;

    if (destinations.length === 0) {
      this.destinationsContainer.innerHTML = `
        <p class="text-gray-600 text-center py-4">No destinations found.</p>
      `;
      return;
    }

    const user = authService.getUser();
    const isAdminOrAuditor = user && ['admin', 'auditor'].includes(user.role);
    const isGuide = user && user.role === 'guide';

    this.destinationsContainer.innerHTML = destinations
      .map((dest) => `
        <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
          <img src="${dest.images?.[0] || '/images/placeholder.jpg'}" alt="${dest.name}" class="w-full h-48 object-cover rounded-t-lg">
          <div class="p-4">
            <h3 class="text-lg font-semibold">${dest.name}</h3>
            <p class="text-gray-600">${dest.short_description || 'No description available'}</p>
            <p class="text-sm text-gray-500">Region: ${dest.region}</p>
            <p class="text-sm text-gray-500">Difficulty: ${dest.difficulty_level}</p>
            <p class="text-sm text-gray-500">Price: ${dest.price_range}</p>
            ${dest.featured ? '<span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full mt-2">Featured</span>' : ''}
            <div class="mt-4 flex space-x-2">
              <button onclick="router.navigate('/destinations/${dest.id}')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">View</button>
              ${
                isAdminOrAuditor || (isGuide && dest.created_by === user?.id)
                  ? `
                    <button onclick="router.navigate('/destinations/edit/${dest.id}')" class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Edit</button>
                    <button onclick="new DestinationListController().deleteDestination(${dest.id})" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
                    ${
                      isAdminOrAuditor && dest.status === 'pending'
                        ? `
                          <button onclick="new DestinationListController().approveDestination(${dest.id})" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Approve</button>
                          <button onclick="new DestinationListController().rejectDestination(${dest.id})" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reject</button>
                        `
                        : ''
                    }
                    ${
                      isAdminOrAuditor
                        ? `
                          <button onclick="new DestinationListController().${dest.featured ? 'unfeature' : 'feature'}Destination(${dest.id})" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">${dest.featured ? 'Unfeature' : 'Feature'}</button>
                        `
                        : ''
                    }
                  `
                  : ''
              }
            </div>
            ${dest.status !== 'approved' ? `<p class="text-sm text-gray-500 mt-2">Status: ${dest.status}</p>` : ''}
          </div>
        </div>
      `)
      .join('');
  }

  renderPagination(pagination) {
    if (!this.paginationContainer) return;

    const { page, pages } = pagination;
    let paginationHTML = '<div class="flex space-x-2 justify-center mt-4">';
    
    if (page > 1) {
      paginationHTML += `<button data-page="${page - 1}" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Previous</button>`;
    }

    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      paginationHTML += `
        <button data-page="${i}" class="px-4 py-2 rounded ${
          i === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
        }">${i}</button>
      `;
    }

    if (page < pages) {
      paginationHTML += `<button data-page="${page + 1}" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Next</button>`;
    }

    paginationHTML += '</div>';
    this.paginationContainer.innerHTML = paginationHTML;
  }

  async deleteDestination(id) {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      await destinationService.deleteDestination(id);
      this.showSuccess('Destination deleted successfully');
      this.loadDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async approveDestination(id) {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await destinationService.approveDestination(id, notes || '');
      this.showSuccess('Destination approved successfully');
      this.loadDestinations();
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
      await destinationService.rejectDestination(id, reason);
      this.showSuccess('Destination rejected successfully');
      this.loadDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async featureDestination(id) {
    try {
      await destinationService.featureDestination(id);
      this.showSuccess('Destination featured successfully');
      this.loadDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async unfeatureDestination(id) {
    try {
      await destinationService.unfeatureDestination(id);
      this.showSuccess('Destination unfeatured successfully');
      this.loadDestinations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  updateFilters() {
    const formData = new FormData(this.filterForm);
    this.filters.region = formData.get('region') || '';
    this.filters.difficulty = formData.get('difficulty') || '';
    this.filters.featured = formData.get('featured') === 'on';
    this.filters.search = formData.get('search') || '';
    this.filters.sort = formData.get('sort') || 'created_at';
    this.filters.order = formData.get('order') || 'desc';
  }

  setLoadingState(loading) {
    if (this.destinationsContainer) {
      this.destinationsContainer.innerHTML = loading
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
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'success-message visible bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
      setTimeout(() => {
        this.errorMessage.className = 'success-message hidden';
      }, 3000);
    }
  }
}

export default DestinationListController;
