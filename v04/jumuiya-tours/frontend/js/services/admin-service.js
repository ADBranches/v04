// frontend/js/services/admin-service.js
import { api } from './api.js';
import AuthService from './auth-service.js';

class AdminService {
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', {
      params,
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async updateUser(id, data) {
    const response = await api.put(`/admin/users/${id}`, data, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async updateUserRole(id, role) {
    const response = await api.put(`/admin/users/${id}/role`, { role }, {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }

  async getAnalytics() {
    const response = await api.get('/admin/analytics', {
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
    });
    return response.data;
  }
}

export default new AdminService();
