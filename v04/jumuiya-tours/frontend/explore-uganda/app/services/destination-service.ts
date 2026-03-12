import type { Destination, GuideVerification, DashboardStats } from "./dashboard.types";
import { apiService } from "./api-service";

class DestinationService {
  // Keep baseUrl for future-proofing, but DO NOT concatenate it with endpoints.
  // All calls must use relative paths, resolved by axios baseURL in api-service.ts.
  private baseUrl = "";

  /**
   * Search / filtered destinations
   * GET /destinations/search
   */
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
        `/destinations/search`,
        { params }
      );
      return response;
    } catch (err: any) {
      console.error("❌ getFilteredDestinations error:", err);
      throw new Error(err.message || "Failed to fetch filtered destinations");
    }
  }

  /**
   * List destinations (simple listing)
   * GET /destinations
   */
  async getDestinations(params?: {
    featured?: boolean;
    limit?: number;
    created_by?: number;
    region?: string;
  }): Promise<{ destinations: Destination[] }> {
    return apiService.get(`/destinations`, { params });
  }

  /**
   * Alias used across admin.destinations.tsx
   * Supports includePending -> maps to status=pending
   * GET /destinations
   */
  async getAll(params?: {
    featured?: boolean;
    limit?: number;
    created_by?: number;
    region?: string;
    includePending?: boolean;
  }): Promise<{ destinations: Destination[] }> {
    const queryParams: Record<string, any> = { ...params };

    if (params?.includePending) {
      queryParams.status = "pending";
      delete queryParams.includePending;
    }

    return apiService.get(`/destinations`, { params: queryParams });
  }

  /**
   * Pending destinations
   * GET /destinations?status=pending
   */
  async getPendingDestinations(params?: { limit?: number }): Promise<{ destinations: Destination[] }> {
    return apiService.get(`/destinations`, { params: { status: "pending", ...params } });
  }

  /**
   * Delete destination
   * DELETE /destinations/:id
   */
  async deleteDestination(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/destinations/${id}`);
  }

  /**
   * Approve destination
   * POST /destinations/:id/approve
   */
  async approveDestination(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/destinations/${id}/approve`, { notes });
  }

  /**
   * Reject destination
   * POST /destinations/:id/reject
   */
  async rejectDestination(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/destinations/${id}/reject`, { reason });
  }

  /**
   * Feature destination
   * POST /destinations/:id/feature
   */
  async featureDestination(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/destinations/${id}/feature`, {});
  }

  /**
   * Unfeature destination
   * POST /destinations/:id/unfeature
   */
  async unfeatureDestination(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/destinations/${id}/unfeature`, {});
  }

  /**
   * Pending guide verifications (admin / auditor)
   * GET /guides/pending
   */
  async getPendingVerifications(params?: { limit?: number }): Promise<{
    pending_applications: GuideVerification[];
    pendingGuides: GuideVerification[];
    count: number;
  }> {
    return apiService.get(`/guides/pending`, { params });
  }

  /**
   * All verifications (admin / auditor)
   * GET /guides/verifications
   */
  async getVerifications(params?: { limit?: number }): Promise<{ verifications: GuideVerification[] }> {
    return apiService.get(`/guides/verifications`, { params });
  }

  /**
   * Approve a verification
   * POST /guides/verifications/:id/approve
   */
  async approveVerification(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/guides/verifications/${id}/approve`, { notes });
  }

  /**
   * Reject a verification
   * POST /guides/verifications/:id/reject
   */
  async rejectVerification(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/guides/verifications/${id}/reject`, { reason });
  }

  /**
   * Admin stats (candidate to relocate to dashboard/admin service later)
   * GET /dashboard/admin/stats
   */
  async getAdminStats(): Promise<DashboardStats> {
    return apiService.get(`/dashboard/admin/stats`);
  }

  /**
   * Get destination by ID
   * GET /destinations/:id
   */
  async getDestinationById(id: number): Promise<Destination> {
    const response = await apiService.get<Destination>(`/destinations/${id}`);
    return response;
  }

  /**
   * For consumer components that expect { destination }
   */
  async getDestination(id: number): Promise<{ destination: Destination }> {
    try {
      const data = await this.getDestinationById(id);
      return { destination: data };
    } catch (err: any) {
      const isNotFound =
        err?.status === 404 ||
        err?.code === "NOT_FOUND" ||
        err?.code === "DESTINATION_NOT_FOUND";

      if (!isNotFound) {
        console.error("❌ Unexpected getDestination error:", err);
      }

      throw err; // preserve ApiError for the route to handle gracefully
    }
  }
}

export const destinationService = new DestinationService();