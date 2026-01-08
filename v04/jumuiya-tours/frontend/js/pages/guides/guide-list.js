export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <div id="navigation"></div>
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">Our Tour Guides</h1>
                
                <!-- Error Message -->
                <div id="errorMessage" class="error-message hidden mb-6"></div>
                
                <!-- Search and Filters -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <form id="guideFilterForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Search -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Search Guides</label>
                            <input type="text" id="search" name="search" 
                                   placeholder="Search by name or expertise..."
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
                        
                        <!-- Status -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                            <select id="status" name="status" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="">All Guides</option>
                                <option value="verified">Verified Only</option>
                                <option value="pending">Pending Verification</option>
                            </select>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="md:col-span-3 flex justify-end">
                            <button type="submit" 
                                    class="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african">
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Guides Grid -->
                <div id="guidesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div class="text-center py-8 col-span-full">
                        <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-4 text-gray-600">Loading guides...</p>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div id="paginationContainer" class="flex justify-center"></div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new GuideListController();
};

import guideService from '../../services/guide-service.js';
import authService from '../../services/auth-service.js';
import router from '../../app/router.js';

class GuideListController {
  constructor() {
    this.filterForm = null;
    this.guidesContainer = null;
    this.paginationContainer = null;
    this.errorMessage = null;
    this.filters = {
      page: 1,
      limit: 9,
      region: '',
      status: '',
      search: '',
    };

    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadGuides();
  }

  bindElements() {
    this.filterForm = document.getElementById('guideFilterForm');
    this.guidesContainer = document.getElementById('guidesContainer');
    this.paginationContainer = document.getElementById('paginationContainer');
    this.errorMessage = document.getElementById('errorMessage');
  }

  bindEvents() {
    if (this.filterForm) {
      this.filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.filters.page = 1;
        this.updateFilters();
        this.loadGuides();
      });

      // Real-time search
      const searchInput = this.filterForm.querySelector('#search');
      searchInput.addEventListener('input', () => {
        this.filters.search = searchInput.value.trim();
        this.filters.page = 1;
        this.loadGuides();
      });

      // Filter inputs
      ['region', 'status'].forEach((field) => {
        const input = this.filterForm.querySelector(`#${field}`);
        if (input) {
          input.addEventListener('change', () => {
            this.filters[field] = input.value;
            this.filters.page = 1;
            this.loadGuides();
          });
        }
      });
    }

    // Pagination
    this.paginationContainer?.addEventListener('click', (e) => {
      const pageButton = e.target.closest('[data-page]');
      if (pageButton) {
        this.filters.page = parseInt(pageButton.dataset.page);
        this.loadGuides();
      }
    });
  }

  async loadGuides() {
    this.setLoadingState(true);
    try {
      const response = await guideService.getGuides(this.filters);
      this.renderGuides(response.guides);
      this.renderPagination(response.pagination);
    } catch (error) {
      this.showError(error.message || 'Failed to load guides');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderGuides(guides) {
    if (!this.guidesContainer) return;

    if (guides.length === 0) {
      this.guidesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-600">No guides found matching your criteria.</p>
        </div>
      `;
      return;
    }

    this.guidesContainer.innerHTML = guides
      .map((guide) => `
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <img src="${guide.profile_image || '/images/guide-placeholder.jpg'}" 
               alt="${guide.user?.name || 'Tour Guide'}" 
               class="w-full h-48 object-cover rounded-t-2xl">
          <div class="p-6">
            <h3 class="text-xl font-bold font-display text-uganda-black mb-2">${guide.user?.name || 'Unknown Guide'}</h3>
            <p class="text-gray-600 mb-3 line-clamp-2">${guide.bio || 'Experienced tour guide specializing in Ugandan adventures.'}</p>
            
            <div class="space-y-2 mb-4">
              ${guide.regions ? `
                <p class="text-sm text-gray-600">
                  <span class="font-semibold">Regions:</span> ${Array.isArray(guide.regions) ? guide.regions.join(', ') : guide.regions}
                </p>
              ` : ''}
              
              ${guide.languages ? `
                <p class="text-sm text-gray-600">
                  <span class="font-semibold">Languages:</span> ${Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}
                </p>
              ` : ''}
              
              ${guide.experience_years ? `
                <p class="text-sm text-gray-600">
                  <span class="font-semibold">Experience:</span> ${guide.experience_years} years
                </p>
              ` : ''}
            </div>
            
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                guide.verification_status === 'verified' 
                  ? 'bg-green-100 text-green-800' 
                  : guide.verification_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }">
                ${guide.verification_status || 'unverified'}
              </span>
              
              <div class="flex space-x-2">
                <button onclick="router.navigate('/guides/${guide.id}')" 
                        class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african text-sm">
                  View Profile
                </button>
                
                ${authService.isAuthenticated() ? `
                  <button onclick="router.navigate('/bookings/create?guide_id=${guide.id}')" 
                          class="bg-safari-forest text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-african text-sm">
                    Book Guide
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');
  }

  renderPagination(pagination) {
    if (!this.paginationContainer) return;

    const { page, pages } = pagination;
    let paginationHTML = '<div class="flex space-x-2 justify-center mt-6">';
    
    if (page > 1) {
      paginationHTML += `
        <button data-page="${page - 1}" 
                class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors font-african">
          Previous
        </button>
      `;
    }

    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      paginationHTML += `
        <button data-page="${i}" 
                class="px-4 py-2 rounded-lg font-african ${
                  i === page 
                    ? 'bg-uganda-black text-white' 
                    : 'bg-uganda-yellow text-uganda-black hover:bg-yellow-400'
                }">
          ${i}
        </button>
      `;
    }

    if (page < pages) {
      paginationHTML += `
        <button data-page="${page + 1}" 
                class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors font-african">
          Next
        </button>
      `;
    }

    paginationHTML += '</div>';
    this.paginationContainer.innerHTML = paginationHTML;
  }

  updateFilters() {
    const formData = new FormData(this.filterForm);
    this.filters.region = formData.get('region') || '';
    this.filters.status = formData.get('status') || '';
    this.filters.search = formData.get('search') || '';
  }

  setLoadingState(loading) {
    if (this.guidesContainer) {
      this.guidesContainer.innerHTML = loading
        ? `
          <div class="col-span-full text-center py-8">
            <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-gray-600">Loading guides...</p>
          </div>
        `
        : '';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-african';
    }
  }
}