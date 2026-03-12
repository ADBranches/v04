// app/services/guide.service.ts
import { apiService } from "./api-service";
import authService from "./auth.service";
import type {
  Guide,
  GuideVerification,
  GuideResponse,
  GuideFilterParams,
  VerificationCredentials,
} from "./guide.types";

interface PendingGuidesResponse {
  pending_applications?: any[];
  pendingGuides?: any[];
  guides?: any[];
  success?: boolean;
  message?: string;
}

class GuideService {
  // ✅ Use relative base path (central axios baseURL handles host/env)
  private baseUrl = "/guides";

  private getAuthHeaders() {
    const token = authService.getToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getGuides(params?: GuideFilterParams): Promise<GuideResponse> {
    try {
      const response = await apiService.get<GuideResponse>(`${this.baseUrl}`, {
        params,
        headers: this.getAuthHeaders(),
      });

      if (!response || !(response as any).guides) {
        throw new Error("No guide data received from server");
      }

      return response;
    } catch (err: any) {
      if (err?.status === 404 || err?.code === "NOT_FOUND") {
        console.info("ℹ️ Expected 404:", err.message);
      } else {
        console.error("❌ Unexpected error:", err);
      }
      throw err; // let enhanced ApiError propagate (status/code/message)
    }
  }

  async getGuide(id: number): Promise<{ guide: Guide | null }> {
    try {
      return await apiService.get<{ guide: Guide }>(`${this.baseUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      // Graceful expected 404 handling
      if (err?.status === 404 || err?.code === "NOT_FOUND") {
        console.info(`ℹ️ Guide with ID ${id} not found.`);
        return { guide: null };
      }

      console.error("❌ getGuide unexpected error:", err);
      throw err;
    }
  }

  async getMyProfile(): Promise<{ guide: Guide }> {
    try {
      return await apiService.get<{ guide: Guide }>(`${this.baseUrl}/me`, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      console.error("❌ getMyProfile error:", err);
      throw err;
    }
  }

  async createGuide(data: {
    bio: string;
    experience_years: number;
    languages: string[];
    specialties: string[];
    hourly_rate: number;
    certifications?: File[];
  }): Promise<{ guide: Guide }> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "certifications" && Array.isArray(value)) {
        value.forEach((file) => formData.append("certifications", file));
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, value as any);
      }
    });

    try {
      return await apiService.postForm<{ guide: Guide }>(`${this.baseUrl}`, formData, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      console.error("❌ createGuide error:", err);
      throw err;
    }
  }

  async updateGuide(id: number, data: Partial<Guide>): Promise<{ guide: Guide }> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "certifications" && Array.isArray(value)) {
        value.forEach((file) => formData.append("certifications", file));
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, value as any);
      }
    });

    try {
      return await apiService.putForm<{ guide: Guide }>(`${this.baseUrl}/${id}`, formData, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      console.error("❌ updateGuide error:", err);
      throw err;
    }
  }

  async updateProfile(data: Partial<Guide>): Promise<{ success: boolean; message: string }> {
    try {
      return await apiService.put<{ success: boolean; message: string }>(
        `${this.baseUrl}/profile`,
        data,
        { headers: this.getAuthHeaders() }
      );
    } catch (err: any) {
      console.error("❌ updateProfile error:", err);
      throw err;
    }
  }

  async getVerification(userId: number): Promise<{ verification: GuideVerification }> {
    try {
      return await apiService.get<{ verification: GuideVerification }>(
        `${this.baseUrl}/verification/${userId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (err: any) {
      if (err?.status === 404 || err?.code === "NOT_FOUND") {
        console.info(`ℹ️ Verification for user ${userId} not found.`);
      } else {
        console.error("❌ getVerification error:", err);
      }
      throw err;
    }
  }

  async submitVerification(
    credentials: VerificationCredentials,
    documents: File[]
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append("credentials", JSON.stringify(credentials));
    documents.forEach((doc) => formData.append("documents", doc));

    try {
      return await apiService.postForm<{ success: boolean; message: string }>(
        `${this.baseUrl}/verification`,
        formData,
        { headers: this.getAuthHeaders() }
      );
    } catch (err: any) {
      console.error("❌ submitVerification error:", err);
      throw err;
    }
  }

  /**
   * ✅ Auditor/Admin: load pending guide applications.
   * NOTE: This assumes the backend exposes GET /guides/pending.
   * If your backend route differs, adjust only this endpoint path.
   */
  async getPendingGuides(): Promise<PendingGuidesResponse> {
    try {
      return await apiService.get<PendingGuidesResponse>(`${this.baseUrl}/pending`, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      console.error("❌ getPendingGuides error:", err);
      throw err;
    }
  }

  /**
   * ✅ Auditor/Admin: approve/verify a guide application.
   * NOTE: This assumes the backend exposes POST /guides/:id/verify.
   */
  async verifyGuide(
    id: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await apiService.post<{ success: boolean; message: string }>(
        `${this.baseUrl}/${id}/verify`,
        { notes },
        { headers: this.getAuthHeaders() }
      );
    } catch (err: any) {
      console.error("❌ verifyGuide error:", err);
      throw err;
    }
  }

  /**
   * ✅ Auditor/Admin: reject a guide application.
   * NOTE: This assumes the backend exposes POST /guides/:id/reject.
   */
  async rejectGuide(
    id: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await apiService.post<{ success: boolean; message: string }>(
        `${this.baseUrl}/${id}/reject`,
        { reason },
        { headers: this.getAuthHeaders() }
      );
    } catch (err: any) {
      console.error("❌ rejectGuide error:", err);
      throw err;
    }
  }
}

export const guideService = new GuideService();
export default guideService;