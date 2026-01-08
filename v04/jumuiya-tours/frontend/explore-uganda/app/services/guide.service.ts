import { apiService } from "./api-service";
import { authService } from "./auth.service";
import type {
  Guide,
  GuideVerification,
  GuideResponse,
  GuideFilterParams,
  VerificationCredentials,
} from "./guide.types";

class GuideService {
  private baseUrl = `${import.meta.env.VITE_API_BASE || "http://localhost:5000/api"}/guides`;

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
      console.error("❌ getGuides error:", err);
      throw new Error(err.message || "Failed to fetch guides");
    }
  }


  async getGuide(id: number): Promise<{ guide: Guide }> {
    try {
      return await apiService.get<{ guide: Guide }>(`${this.baseUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      console.error("❌ getGuide error:", err);
      throw new Error(err.message || "Failed to fetch guide");
    }
  }

  async getMyProfile(): Promise<{ guide: Guide }> {
    try {
      return await apiService.get<{ guide: Guide }>(`${this.baseUrl}/me`, {
        headers: this.getAuthHeaders(),
      });
    } catch (err: any) {
      console.error("❌ getMyProfile error:", err);
      throw new Error(err.message || "Failed to fetch guide profile");
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
      throw new Error(err.message || "Failed to create guide");
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
      throw new Error(err.message || "Failed to update guide");
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
      throw new Error(err.message || "Failed to update profile");
    }
  }

  async getVerification(userId: number): Promise<{ verification: GuideVerification }> {
    try {
      return await apiService.get<{ verification: GuideVerification }>(
        `${this.baseUrl}/verification/${userId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (err: any) {
      console.error("❌ getVerification error:", err);
      throw new Error(err.message || "Failed to fetch verification details");
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
      throw new Error(err.message || "Failed to submit verification");
    }
  }
}

export const guideService = new GuideService();
export default guideService;
