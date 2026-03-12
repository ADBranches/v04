// admin-service.ts
import { apiMethods } from './api-service';
import authService from './auth.service';

export interface AnalyticsData {
  totalUsers: number;
  totalDestinations: number;
  pendingApprovals: number;
  totalBookings: number;
  revenue: number;
}

class AdminService {
  /**
   * List users
   * GET /admin/users
   */
  async getUsers(params = {}) {
    return apiMethods.get('/admin/users', {
      params,
      ...this.getAuthConfig(),
    });
  }

  /**
   * Update user (generic)
   * PUT /admin/users/:id
   */
  async updateUser(id: number, data: any) {
    return apiMethods.put(`/admin/users/${id}`, data, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  /**
   * Update user role (explicit helper)
   * Backend expects role in the body at PUT /admin/users/:id
   */
  async updateUserRole(id: number, role: string) {
    return apiMethods.put(`/admin/users/${id}`, { role }, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  /**
   * Admin analytics / stats
   * GET /admin/stats
   */
  async getAnalytics(): Promise<AnalyticsData> {
    return apiMethods.get<AnalyticsData>('/admin/stats', {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  private getAuthConfig() {
    const token = authService.getToken();
    return token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
  }

  async getActivity(page = 1, limit = 20) {
    return apiMethods.get(`/moderation/logs/activity`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${authService.getToken()}` }
    });
  }
  
  async getRoles() {
    return apiMethods.get('/admin/roles', {
      headers: { Authorization: `Bearer ${authService.getToken()}` }
    });
  }

  async deleteUser(id: number) {
    return apiMethods.delete(`/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` }
    });
  }
  
}

export default new AdminService();