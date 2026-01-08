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

// // app/services/destination-service.ts
// import type { Destination, GuideVerification, DashboardStats } from "./dashboard.types";
// import { apiService } from "./api-service"; // place near the top
// /**
//  * Destination & Dashboard Service
//  * Provides CRUD, filtering, moderation, and verification utilities.
//  */
// class DestinationService {
//   private baseUrl = import.meta.env.VITE_API_BASE || "/api";

//   private getAuthHeaders(): HeadersInit {
//     const token = localStorage.getItem("token");
//     return {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//     };
//   }

//   /* ────────────────────────────────
//    * 🔍 Advanced Search & Filtering
//    * ──────────────────────────────── */
//   async getFilteredDestinations(params?: {
//   query?: string;
//   region?: string;
//   difficulty?: string;
//   min_price?: number;
//   max_price?: number;
//   featured?: boolean;
//   limit?: number;
//   page?: number;
// }): Promise<{ destinations: Destination[]; pagination?: any }> {
//   try {
//     const response = await apiService.get<{ destinations: Destination[]; pagination?: any }>(
//       "/destinations/search",
//       { params }
//     );
//     return response;
//   } catch (err: any) {
//     console.error("❌ getFilteredDestinations error:", err);
//     throw new Error(err.message || "Failed to fetch filtered destinations");
//   }
// }

//   /* ────────────────────────────────
//    * 📦 CRUD Operations
//    * ──────────────────────────────── */
//   async getDestinations(params?: {
//     featured?: boolean;
//     limit?: number;
//     created_by?: number;
//     region?: string;
//   }): Promise<{ destinations: Destination[] }> {
//     const queryParams = new URLSearchParams();
//     if (params?.featured) queryParams.append("featured", "true");
//     if (params?.limit) queryParams.append("limit", params.limit.toString());
//     if (params?.created_by) queryParams.append("created_by", params.created_by.toString());
//     if (params?.region) queryParams.append("region", params.region);

//     const response = await fetch(`${this.baseUrl}/destinations?${queryParams.toString()}`, {
//       headers: this.getAuthHeaders(),
//     });

//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to fetch destinations");
//     }

//     return await response.json();
//   }

//   async getPendingDestinations(params?: { limit?: number }): Promise<{ destinations: Destination[] }> {
//     const queryParams = new URLSearchParams();
//     queryParams.append("status", "pending");
//     if (params?.limit) queryParams.append("limit", params.limit.toString());

//     const response = await fetch(`${this.baseUrl}/destinations?${queryParams.toString()}`, {
//       headers: this.getAuthHeaders(),
//     });

//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to fetch pending destinations");
//     }

//     return await response.json();
//   }

//   async deleteDestination(id: number): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/destinations/${id}`, {
//       method: "DELETE",
//       headers: this.getAuthHeaders(),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to delete destination");
//     }
//     return await response.json();
//   }

//   async approveDestination(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/destinations/${id}/approve`, {
//       method: "POST",
//       headers: this.getAuthHeaders(),
//       body: JSON.stringify({ notes }),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to approve destination");
//     }
//     return await response.json();
//   }

//   async rejectDestination(id: number, reason: string): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/destinations/${id}/reject`, {
//       method: "POST",
//       headers: this.getAuthHeaders(),
//       body: JSON.stringify({ reason }),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to reject destination");
//     }
//     return await response.json();
//   }

//   async featureDestination(id: number): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/destinations/${id}/feature`, {
//       method: "POST",
//       headers: this.getAuthHeaders(),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to feature destination");
//     }
//     return await response.json();
//   }

//   async unfeatureDestination(id: number): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/destinations/${id}/unfeature`, {
//       method: "POST",
//       headers: this.getAuthHeaders(),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to unfeature destination");
//     }
//     return await response.json();
//   }

//   /* ────────────────────────────────
//    * 🧭 Guide Verification
//    * ──────────────────────────────── */
//   async getPendingVerifications(params?: { limit?: number }): Promise<{
//     pending_applications: GuideVerification[];
//     pendingGuides: GuideVerification[];
//     count: number;
//   }> {
//     const queryParams = new URLSearchParams();
//     if (params?.limit) queryParams.append("limit", params.limit.toString());

//     const response = await fetch(`${this.baseUrl}/guides/pending?${queryParams.toString()}`, {
//       headers: this.getAuthHeaders(),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to fetch pending verifications");
//     }
//     return await response.json();
//   }

//   async getVerifications(params?: { limit?: number }): Promise<{ verifications: any[] }> {
//     const queryParams = new URLSearchParams();
//     if (params?.limit) queryParams.append("limit", params.limit.toString());

//     const response = await fetch(`${this.baseUrl}/guides/verifications?${queryParams.toString()}`, {
//       headers: this.getAuthHeaders(),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to fetch verifications");
//     }
//     return await response.json();
//   }

//   async approveVerification(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/guides/verifications/${id}/approve`, {
//       method: "POST",
//       headers: this.getAuthHeaders(),
//       body: JSON.stringify({ notes }),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to approve verification");
//     }
//     return await response.json();
//   }

//   async rejectVerification(id: number, reason: string): Promise<{ success: boolean; message: string }> {
//     const response = await fetch(`${this.baseUrl}/guides/verifications/${id}/reject`, {
//       method: "POST",
//       headers: this.getAuthHeaders(),
//       body: JSON.stringify({ reason }),
//     });
//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.message || "Failed to reject verification");
//     }
//     return await response.json();
//   }

//   /* ────────────────────────────────
//    * 📊 Dashboard Stats
//    * ──────────────────────────────── */
//   async getAdminStats(): Promise<DashboardStats> {
//     const response = await fetch(`${this.baseUrl}/dashboard/admin/stats`, {
//       headers: this.getAuthHeaders(),
//     });
//     if (!response.ok) {
//       throw new Error("Failed to fetch admin stats");
//     }
//     return await response.json();
//   }
// }

// export const destinationService = new DestinationService();
