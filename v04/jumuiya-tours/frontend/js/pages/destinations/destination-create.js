// frontend/js/pages/destinations/destination-create.js
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
                    <h1 class="text-3xl font-bold font-display text-uganda-black mb-8" id="pageTitle">Create Destination</h1>
                    
                    <!-- Messages -->
                    <div id="errorMessage" class="error-message hidden mb-6"></div>
                    <div id="successMessage" class="success-message hidden mb-6"></div>
                    
                    <!-- Destination Form -->
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <form id="destinationForm" class="space-y-6">
                            <!-- Name -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Destination Name *</label>
                                <input type="text" id="name" name="name" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                            </div>
                            
                            <!-- Short Description -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
                                <textarea id="short_description" name="short_description" rows="2" required
                                          placeholder="Brief description for listings..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                            </div>
                            
                            <!-- Full Description -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Full Description *</label>
                                <textarea id="description" name="description" rows="4" required
                                          placeholder="Detailed description of the destination..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                            </div>
                            
                            <!-- Location & Region -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input type="text" id="location" name="location" required
                                           placeholder="Specific location or address"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                                    <select id="region" name="region" required
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                        <option value="">Select a region</option>
                                        <option value="Central">Central Uganda</option>
                                        <option value="Northern">Northern Uganda</option>
                                        <option value="Western">Western Uganda</option>
                                        <option value="Eastern">Eastern Uganda</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- District -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">District</label>
                                <select id="district" name="district"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                    <option value="">Select a district</option>
                                </select>
                            </div>
                            
                            <!-- Price & Duration -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Price Range *</label>
                                    <select id="price_range" name="price_range" required
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                        <option value="">Select price range</option>
                                        <option value="$">Budget ($)</option>
                                        <option value="$$">Moderate ($$)</option>
                                        <option value="$$$">Premium ($$$)</option>
                                        <option value="$$$$">Luxury ($$$$)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                                    <input type="text" id="duration" name="duration" required
                                           placeholder="e.g., 3 days, 1 week"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                </div>
                            </div>
                            
                            <!-- Difficulty & Season -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty Level *</label>
                                    <select id="difficulty_level" name="difficulty_level" required
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                        <option value="">Select difficulty</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Challenging">Challenging</option>
                                        <option value="Difficult">Difficult</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Best Season *</label>
                                    <input type="text" id="best_season" name="best_season" required
                                           placeholder="e.g., June to August"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                </div>
                            </div>
                            
                            <!-- Highlights -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Highlights (one per line)</label>
                                <textarea id="highlights" name="highlights" rows="3"
                                          placeholder="Key attractions or activities..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                            </div>
                            
                            <!-- Included & Not Included -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Included (one per line)</label>
                                    <textarea id="included" name="included" rows="3"
                                              placeholder="What's included in the tour..."
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Not Included (one per line)</label>
                                    <textarea id="not_included" name="not_included" rows="3"
                                              placeholder="What's not included..."
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                                </div>
                            </div>
                            
                            <!-- Requirements -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                                <textarea id="requirements" name="requirements" rows="2"
                                          placeholder="Any special requirements..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"></textarea>
                            </div>
                            
                            <!-- Submit Button -->
                            <button type="submit" 
                                    class="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-display">
                                Create Destination
                            </button>
                        </form>
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
    new DestinationCreateController();
};

class DestinationCreateController {
  constructor() {
    this.form = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.isEditMode = false;
    this.destinationId = null;

    this.regionSelect = null;
    this.districtSelect = null;

    this.init();
  }

  init() {
    // Check if user has permission to create/edit destinations
    if (!authService.isAuthenticated() || !['admin', 'auditor', 'guide'].includes(authService.getUser()?.role)) {
      router.navigate('/auth/login');
      return;
    }

    // Determine if in edit mode
    const path = window.location.pathname;
    if (path.includes('/edit/')) {
      this.isEditMode = true;
      this.destinationId = parseInt(path.split('/').pop());
    }

    this.bindElements();
    this.bindEvents();

    this.loadRegionsAndDistricts();
    if (this.isEditMode) {
      this.loadDestination();
    }
  }

  bindElements() {
    this.form = document.getElementById('destinationForm');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');

    this.regionSelect = document.getElementById('region');
    this.districtSelect = document.getElementById('district');
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
      Array.from(this.form.elements).forEach((input) => {
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    }
    if (this.regionSelect) {
      this.regionSelect.addEventListener('change', () => this.updateDistrictOptions());
    }
  }

  loadRegionsAndDistricts() {
    const regionsAndDistricts = {
      Central: ['Kampala', 'Wakiso', 'Mukono', 'Masaka', 'Mpigi', 'Kalangala', 'Kayunga', 'Kiboga', 'Luwero', 'Mityana', 'Nakaseke', 'Nakasongola', 'Rakai', 'Sembabule', 'Buikwe', 'Bukomansimbi', 'Butambala', 'Buvuma', 'Gomba', 'Kalungu', 'Kyankwanzi', 'Lwengo'],
      Northern: ['Gulu', 'Lira', 'Arua', 'Kitgum', 'Nebbi', 'Adjumani', 'Amuru', 'Apac', 'Dokolo', 'Kole', 'Lamwo', 'Maracha', 'Oyam', 'Pader', 'Zombo', 'Amolatar', 'Abim', 'Agago', 'Alebtong', 'Amudat', 'Kaabong', 'Koboko', 'Kotido', 'Moroto', 'Nakapiripirit', 'Napak', 'Nwoya', 'Otuke', 'Yumbe'],
      Western: ['Kasese', 'Fort Portal', 'Mbarara', 'Kabale', 'Bushenyi', 'Hoima', 'Masindi', 'Bundibugyo', 'Kyenjojo', 'Kamwenge', 'Kanungu', 'Kibaale', 'Kisoro', 'Ntungamo', 'Rukungiri', 'Buhweju', 'Bulisa', 'Ibanda', 'Isingiro', 'Kiruhura', 'Kyegegwa', 'Mitooma', 'Ntoroko', 'Rubirizi', 'Sheema'],
      Eastern: ['Jinja', 'Mbale', 'Tororo', 'Soroti', 'Iganga', 'Bugiri', 'Busia', 'Kamuli', 'Kapchorwa', 'Kumi', 'Pallisa', 'Sironko', 'Katakwi', 'Mayuge', 'Budaka', 'Bududa', 'Bukedea', 'Bukwa', 'Butaleja', 'Kaberamaido', 'Kaliro', 'Manafwa', 'Namutumba', 'Serere']
    };
    
    if (this.regionSelect) {
      this.regionSelect.innerHTML = `
        <option value="">Select a region</option>
        ${Object.keys(regionsAndDistricts).map(region => `
          <option value="${region}">${region} Uganda</option>
        `).join('')}
      `;
    }
    this.regionsAndDistricts = regionsAndDistricts;
    this.updateDistrictOptions();
  }

  updateDistrictOptions() {
    if (!this.districtSelect || !this.regionSelect) return;
    const selectedRegion = this.regionSelect.value;
    const districts = this.regionsAndDistricts[selectedRegion] || [];
    this.districtSelect.innerHTML = `
      <option value="">Select a district</option>
      ${districts.map(district => `
        <option value="${district}">${district}</option>
      `).join('')}
    `;
    this.districtSelect.disabled = !selectedRegion;
  }

  async loadDestination() {
    try {
      const response = await destinationService.getDestination(this.destinationId);
      const dest = response.destination;
      this.populateForm(dest);
    } catch (error) {
      this.showError(error.message);
      router.navigate('/destinations');
    }
  }

  populateForm(dest) {
    document.getElementById('name').value = dest.name || '';
    document.getElementById('description').value = dest.description || '';
    document.getElementById('short_description').value = dest.short_description || '';
    document.getElementById('location').value = dest.location || '';
    document.getElementById('region').value = dest.region || '';
    document.getElementById('price_range').value = dest.price_range || '';
    document.getElementById('duration').value = dest.duration || '';
    document.getElementById('difficulty_level').value = dest.difficulty_level || '';
    document.getElementById('best_season').value = dest.best_season || '';
    document.getElementById('highlights').value = dest.highlights?.join('\n') || '';
    document.getElementById('included').value = dest.included?.join('\n') || '';
    document.getElementById('not_included').value = dest.not_included?.join('\n') || '';
    document.getElementById('requirements').value = dest.requirements || '';

    this.updateDistrictOptions();
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.validateForm()) return;

    const data = this.getFormData();
    this.setLoadingState(true);

    try {
        let response;
        if (this.isEditMode) {
        response = await destinationService.updateDestination(this.destinationId, data);
        this.showSuccess('Destination updated successfully');
        } else {
        response = await destinationService.createDestination(data);
        
        const currentUser = authService.getUser();
        
        // For guides, ask if they want to submit for moderation
        if (currentUser.role === 'guide') {
            const shouldSubmit = confirm('Do you want to submit this destination for moderation and approval? You can also submit it later from your dashboard.');
            
            if (shouldSubmit) {
            try {
                if (typeof ModerationService !== 'undefined' && ModerationService.submitContent) {
                await ModerationService.submitContent('destination', response.destination.id);
                this.showSuccess('Destination created and submitted for moderation');
                } else {
                await destinationService.submitDestination(response.destination.id);
                this.showSuccess('Destination created and submitted for approval');
                }
            } catch (moderationError) {
                console.warn('Moderation submission failed:', moderationError);
                this.showSuccess('Destination created successfully (moderation submission failed)');
            }
            } else {
            this.showSuccess('Destination created successfully. You can submit it for moderation later.');
            }
        } else {
            this.showSuccess('Destination created successfully');
        }
        }

        // Navigate after success
        setTimeout(() => {
        if (this.isEditMode) {
            router.navigate(`/destinations/${this.destinationId}`);
        } else {
            const user = authService.getUser();
            if (user.role === 'guide') {
            router.navigate('/dashboard/guide');
            } else {
            router.navigate('/destinations');
            }
        }
        }, 2000);

    } catch (error) {
        this.showError(error.message || 'Failed to process destination');
    } finally {
        this.setLoadingState(false);
    }
    }

  getFormData() {
    const formData = new FormData(this.form);
    return {
      name: formData.get('name').trim(),
      description: formData.get('description').trim(),
      short_description: formData.get('short_description').trim(),
      location: formData.get('location').trim(),
      region: formData.get('region'),
      district: formData.get('district'),
      price_range: formData.get('price_range'),
      duration: formData.get('duration'),
      difficulty_level: formData.get('difficulty_level'),
      best_season: formData.get('best_season'),
      highlights: formData.get('highlights').split('\n').filter(Boolean),
      included: formData.get('included').split('\n').filter(Boolean),
      not_included: formData.get('not_included').split('\n').filter(Boolean),
      requirements: formData.get('requirements').trim(),
    };
  }

  validateForm() {
    let isValid = true;
    const requiredFields = ['name', 'description', 'location'];
    const formData = this.getFormData();

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        this.showFieldError(document.getElementById(field), `${field.replace('_', ' ')} is required`);
        isValid = false;
      }
    });

    if (formData.name.length < 3) {
      this.showFieldError(document.getElementById('name'), 'Name must be at least 3 characters');
      isValid = false;
    }

    return isValid;
  }

  setLoadingState(loading) {
    const submitButton = this.form?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.innerHTML = loading
        ? `<svg class="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...`
        : this.isEditMode ? 'Update Destination' : 'Create Destination';
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
    }
  }

  showFieldError(input, message) {
    this.clearFieldError(input);
    input.classList.add('border-red-500');
    const errorElement = document.createElement('p');
    errorElement.className = 'mt-1 text-sm text-red-600';
    errorElement.textContent = message;
    errorElement.id = `${input.id}-error`;
    input.parentNode.appendChild(errorElement);
  }

  clearFieldError(input) {
    input.classList.remove('border-red-500');
    input.classList.add('border-gray-300');
    const existingError = document.getElementById(`${input.id}-error`);
    if (existingError) existingError.remove();
  }
}

export default DestinationCreateController;