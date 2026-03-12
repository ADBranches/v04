// app/services/dashboard.service.ts
import { API_BASE_URL } from "../config/app-config";
import type { Destination, GuideVerification, DashboardStats } from "./dashboard.types";

class DashboardService {
  private baseUrl = API_BASE_URL;

  private getAuthHeaders(): HeadersInit {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return {
        "Content-Type": "application/json",
      };
    }

    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        throw new Error(error.message || "API error occurred");
      } catch {
        throw new Error(text || "Unexpected response from server");
      }
    }
    return response.json();
  }

  // ✅ Example fixes
  async getPendingDestinations(params?: { limit?: number }): Promise<{ destinations: Destination[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    queryParams.append("status", "pending");

    const response = await fetch(`${this.baseUrl}/destinations?${queryParams.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getDestinations(params?: {
    featured?: boolean;
    limit?: number;
    created_by?: number;
    region?: string;
  }): Promise<{ destinations: Destination[] }> {
    const queryParams = new URLSearchParams();
    if (params?.featured) queryParams.append("featured", "true");
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.created_by) queryParams.append("created_by", params.created_by.toString());
    if (params?.region) queryParams.append("region", params.region);

    const response = await fetch(`${this.baseUrl}/destinations?${queryParams.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteDestination(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/destinations/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async approveDestination(id: number, notes?: string) {
    const response = await fetch(`${this.baseUrl}/destinations/${id}/approve`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    return this.handleResponse(response);
  }

  async rejectDestination(id: number, reason: string) {
    const response = await fetch(`${this.baseUrl}/destinations/${id}/reject`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return this.handleResponse(response);
  }

  async getAdminStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/dashboard/admin/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getVerifications(params?: { limit?: number }): Promise<{ verifications: GuideVerification[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${this.baseUrl}/guides/verifications?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  async approveVerification(id: number, notes?: string) {
    const response = await fetch(`${this.baseUrl}/guides/verifications/${id}/approve`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    return this.handleResponse(response);
  }

  async rejectVerification(id: number, reason: string) {
    const response = await fetch(`${this.baseUrl}/guides/verifications/${id}/reject`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    return this.handleResponse(response);
  }
}

export const dashboardService = new DashboardService();
