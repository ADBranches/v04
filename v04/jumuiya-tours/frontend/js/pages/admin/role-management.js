// frontend/js/pages/admin/role-management.js
import AuthService from '../../services/auth-service.js';
import AdminService from '../../services/admin-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

class RoleManagementController {
  constructor() {
    this.userContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.paginationContainer = null;
    this.filterForm = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated() || !AuthService.hasRole(['admin'])) {
      router.navigate('/auth/login');
      return;
    }
    this.bindElements();
    this.bindEvents();
    this.loadUsers();
  }

  bindElements() {
    this.userContainer = document.getElementById('userContainer');
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
      role: formData.get('role'),
      page: 1,
      limit: 10,
    };
    await this.loadUsers(params);
  }

  async loadUsers(params = { page: 1, limit: 10 }) {
    this.setLoadingState(true);
    try {
      const response = await AdminService.getUsers(params);
      this.renderUsers(response.users, response.pagination);
    } catch (error) {
      this.showError(error.message || 'Failed to load users');
    } finally {
      this.setLoadingState(false);
    }
  }

  async updateRole(id, role) {
    try {
      await AdminService.updateUserRole(id, role);
      this.showSuccess('Role updated successfully');
      this.loadUsers();
    } catch (error) {
      this.showError(error.message || 'Failed to update role');
    }
  }

  renderUsers(users, pagination) {
    if (!this.userContainer || !this.paginationContainer) return;
    this.userContainer.innerHTML = users.length === 0
      ? '<p class="text-gray-600 text-center py-8 font-african">No users found.</p>'
      : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${users.map(user => `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <div class="p-6">
                <h3 class="text-lg font-semibold font-display text-uganda-black">${user.name}</h3>
                <p class="text-gray-600 mb-2">Email: ${user.email}</p>
                <p class="text-sm text-gray-500">Current Role: ${user.role}</p>
                <div class="mt-4">
                  <label for="role-${user.id}" class="block text-sm font-medium text-uganda-black font-african">Assign Role</label>
                  <select id="role-${user.id}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow font-african">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="guide" ${user.role === 'guide' ? 'selected' : ''}>Guide</option>
                    <option value="auditor" ${user.role === 'auditor' ? 'selected' : ''}>Auditor</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                  </select>
                  <button onclick="new RoleManagementController().updateRole(${user.id}, document.getElementById('role-${user.id}').value)" class="mt-2 bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Update Role</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    this.paginationContainer.innerHTML = `
      <div class="flex justify-center space-x-2 mt-6">
        ${pagination.page > 1 ? `
          <button onclick="new RoleManagementController().loadUsers({ page: ${pagination.page - 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Previous</button>
        ` : ''}
        <span class="px-4 py-2 text-uganda-black font-african">Page ${pagination.page} of ${pagination.pages}</span>
        ${pagination.page < pagination.pages ? `
          <button onclick="new RoleManagementController().loadUsers({ page: ${pagination.page + 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Next</button>
        ` : ''}
      </div>
    `;
  }

  setLoadingState(loading) {
    if (this.userContainer) {
      this.userContainer.innerHTML = loading
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
  new RoleManagementController();
});

export default RoleManagementController;
