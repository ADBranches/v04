import type { Destination, GuideVerification, DashboardStats } from "./dashboard.types";
import { apiService } from "./api-service";

class DestinationService {
  private baseUrl = `${import.meta.env.VITE_API_BASE || "http://localhost:5000/api"}`;

  async getFilteredDestinations(params?: {
    query?: string;
    region?: string;
    difficulty?: string;
    min_price?: number;
    max_price?: number;
    featured?: boolean;
    limit?: number;
    page?: number;
  }): Promise<{ destinations: Destination[]; pagination?: any }> {
    try {
      const response = await apiService.get<{ destinations: Destination[]; pagination?: any }>(
        `${this.baseUrl}/destinations/search`,
        { params }
      );
      return response;
    } catch (err: any) {
      console.error("❌ getFilteredDestinations error:", err);
      throw new Error(err.message || "Failed to fetch filtered destinations");
    }
  }

  async getDestinations(params?: {
    featured?: boolean;
    limit?: number;
    created_by?: number;
    region?: string;
  }): Promise<{ destinations: Destination[] }> {
    return apiService.get(`${this.baseUrl}/destinations`, { params });
  }

  async getPendingDestinations(params?: { limit?: number }): Promise<{ destinations: Destination[] }> {
    return apiService.get(`${this.baseUrl}/destinations`, { params: { status: "pending", ...params } });
  }

  async deleteDestination(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`${this.baseUrl}/destinations/${id}`);
  }

  async approveDestination(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`${this.baseUrl}/destinations/${id}/approve`, { notes });
  }

  async rejectDestination(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`${this.baseUrl}/destinations/${id}/reject`, { reason });
  }

  async featureDestination(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`${this.baseUrl}/destinations/${id}/feature`, {});
  }

  async unfeatureDestination(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`${this.baseUrl}/destinations/${id}/unfeature`, {});
  }

  async getPendingVerifications(params?: { limit?: number }): Promise<{
    pending_applications: GuideVerification[];
    pendingGuides: GuideVerification[];
    count: number;
  }> {
    return apiService.get(`${this.baseUrl}/guides/pending`, { params });
  }

  async getVerifications(params?: { limit?: number }): Promise<{ verifications: any[] }> {
    return apiService.get(`${this.baseUrl}/guides/verifications`, { params });
  }

  async approveVerification(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`${this.baseUrl}/guides/verifications/${id}/approve`, { notes });
  }

  async rejectVerification(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`${this.baseUrl}/guides/verifications/${id}/reject`, { reason });
  }

  async getAdminStats(): Promise<DashboardStats> {
    return apiService.get(`${this.baseUrl}/dashboard/admin/stats`);
  }

  async getDestinationById(id: number): Promise<Destination> {
    const response = await apiService.get<Destination>(`${this.baseUrl}/destinations/${id}`);
    return response;
  }

  async getDestination(id: number): Promise<{ destination: Destination }> {
    try {
      const data = await this.getDestinationById(id);
      return { destination: data };
    } catch (err: any) {
      console.error("❌ getDestination error:", err);
      throw new Error(err.message || "Failed to fetch destination details");
    }
  }
}

export const destinationService = new DestinationService();

