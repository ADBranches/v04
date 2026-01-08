import { apiMethods } from './api-service.js';
import authService from './auth.service.ts';

export interface AnalyticsData {
  totalUsers: number;
  totalDestinations: number;
  pendingGuides: number;
  totalBookings: number;
  revenue: number;
}

class AdminService {
  async getUsers(params = {}) {
    return apiMethods.get('/admin/users', {
      params,
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  async updateUser(id: number, data: any) {
    return apiMethods.put(`/admin/users/${id}`, data, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  async deleteUser(id: number) {
    return apiMethods.delete(`/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  async updateUserRole(id: number, role: string) {
    return apiMethods.put(`/admin/users/${id}/role`, { role }, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return apiMethods.get<AnalyticsData>('/admin/analytics', {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }
}

export default new AdminService();