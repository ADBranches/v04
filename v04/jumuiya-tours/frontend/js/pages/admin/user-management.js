// frontend/js/pages/admin/user-management.js
import AuthService from '../../services/auth-service.js';
import AdminService from '../../services/admin-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

export const render = () => {
    return `
        <div class="min-h-screen bg-safari-sand">
            <div id="navigation"></div>
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-3xl font-bold font-display text-uganda-black mb-8">User Management</h1>
                
                <!-- Messages -->
                <div id="errorMessage" class="error-message hidden mb-6"></div>
                <div id="successMessage" class="success-message hidden mb-6"></div>
                
                <!-- Filters -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <form id="filterForm" class="flex flex-wrap gap-4 items-end">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select name="role" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow">
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="auditor">Auditor</option>
                                <option value="guide">Guide</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                        <button type="submit" 
                                class="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african">
                            Filter
                        </button>
                    </form>
                </div>
                
                <!-- Users Container -->
                <div id="userContainer" class="mb-8">
                    <div cl
                    ass="text-center py-8">
                        <svg class="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-4 text-gray-600">Loading users...</p>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div id="paginationContainer"></div>
            </div>
        </div>
    `;
};

export const afterRender = () => {
    new UserManagementController();
};
class UserManagementController {
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

  async updateUser(id, data) {
    try {
      await AdminService.updateUser(id, data);
      this.showSuccess('User updated successfully');
      this.loadUsers();
    } catch (error) {
      this.showError(error.message || 'Failed to update user');
    }
  }

  async deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await AdminService.deleteUser(id);
      this.showSuccess('User deleted successfully');
      this.loadUsers();
    } catch (error) {
      this.showError(error.message || 'Failed to delete user');
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
                <p class="text-sm text-gray-500">Role: ${user.role}</p>
                <p class="text-sm text-gray-500">Guide Status: ${user.guide_status || 'N/A'}</p>
                <p class="text-sm text-gray-500">Joined: ${new Date(user.created_at).toLocaleDateString('en-UG')}</p>
                <div class="flex space-x-2 mt-4">
                  <button onclick="new UserManagementController().editUser(${user.id})" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african">Edit</button>
                  <button onclick="new UserManagementController().deleteUser(${user.id})" class="bg-uganda-red text-white px-4 py-2 rounded-lg hover:bg-uganda-dark-red font-african">Delete</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    this.paginationContainer.innerHTML = `
      <div class="flex justify-center space-x-2 mt-6">
        ${pagination.page > 1 ? `
          <button onclick="new UserManagementController().loadUsers({ page: ${pagination.page - 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Previous</button>
        ` : ''}
        <span class="px-4 py-2 text-uganda-black font-african">Page ${pagination.page} of ${pagination.pages}</span>
        ${pagination.page < pagination.pages ? `
          <button onclick="new UserManagementController().loadUsers({ page: ${pagination.page + 1}, limit: ${pagination.limit} })" class="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african">Next</button>
        ` : ''}
      </div>
    `;
  }

  editUser(id) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 class="text-xl font-bold font-display text-uganda-black mb-4">Edit User</h2>
        <form id="editUserForm">
          <div class="mb-4">
            <label for="name" class="block text-sm font-medium text-uganda-black font-african">Name</label>
            <input type="text" id="name" name="name" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow font-african">
          </div>
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-uganda-black font-african">Email</label>
            <input type="email" id="email" name="email" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow font-african">
          </div>
          <div class="mb-4">
            <label for="guide_status" class="block text-sm font-medium text-uganda-black font-african">Guide Status</label>
            <select id="guide_status" name="guide_status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow font-african">
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div class="flex space-x-4">
            <button type="submit" class="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display">Save</button>
            <button type="button" onclick="this.closest('.fixed').remove()" class="bg-safari-sand text-uganda-black px-4 py-2 rounded-lg hover:bg-gray-300 font-display">Cancel</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    const form = modal.querySelector('#editUserForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        guide_status: formData.get('guide_status'),
      };
      await this.updateUser(id, data);
      modal.remove();
    });
    // Populate form with user data
    AdminService.getUsers({ id }).then(response => {
      const user = response.users[0];
      form.querySelector('#name').value = user.name;
      form.querySelector('#email').value = user.email;
      form.querySelector('#guide_status').value = user.guide_status || 'unverified';
    });
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

export default UserManagementController;