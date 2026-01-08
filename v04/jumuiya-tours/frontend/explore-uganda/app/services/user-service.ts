import { apiMethods } from "./api-service.js";
import authService from "./auth.service.ts";

/* ──────────── TYPES ──────────── */
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  guide_status?: string;
  bio?: string;
  phone?: string;
  location?: string;
  languages?: string[];
  specialties?: string[];
  profile_image?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  location?: string;
  languages?: string[];
  specialties?: string[];
  profile_image?: string;
  preferences?: Record<string, any>;
}

export interface UsersResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ──────────── MAIN SERVICE ──────────── */
class UserService {
  private baseUrl = "/users";

  /* ✅ Fetch current authenticated user profile */
  async getProfile(): Promise<UserProfile> {
    return apiMethods.get<UserProfile>(`${this.baseUrl}/me`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  /* ✅ Update current authenticated profile */
  async updateProfile(data: UserUpdateData): Promise<UserProfile> {
    return apiMethods.put<UserProfile>(`${this.baseUrl}/me`, data, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }

  /* ✅ Change password (current → new) */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return apiMethods.post<{ message: string }>(
      `${this.baseUrl}/change-password`,
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      }
    );
  }

  /* ✅ Update user preferences (language, theme, notifications, etc.) */
  async updatePreferences(
    prefs: Record<string, any>
  ): Promise<{ message: string; preferences: Record<string, any> }> {
    return apiMethods.patch<{ message: string; preferences: Record<string, any> }>(
      `${this.baseUrl}/preferences`,
      prefs,
      {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      }
    );
  }

  /* ✅ Upload profile image */
  async uploadProfileImage(
    imageFile: File
  ): Promise<{ image_url: string; message: string }> {
    const formData = new FormData();
    formData.append("profile_image", imageFile);

    return apiMethods.post<{ image_url: string; message: string }>(
      `${this.baseUrl}/upload-profile-image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
  }

  /* ✅ Delete profile image */
  async deleteProfileImage(): Promise<{ message: string }> {
    return apiMethods.delete<{ message: string }>(
      `${this.baseUrl}/profile-image`,
      {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      }
    );
  }

  /* ✅ Public profile lookup (by ID, visible to others) */
  async getPublicProfile(userId: number): Promise<UserProfile> {
    return apiMethods.get<UserProfile>(`${this.baseUrl}/${userId}/public`);
  }

  /* ✅ Search for users (admin/auditor use case) */
  async searchUsers(params: {
    search?: string;
    role?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    return apiMethods.get<UsersResponse>(`${this.baseUrl}/search`, { params });
  }

  /* ✅ Activity stats (destinations, bookings, reviews, joined date) */
  async getActivityStats(userId?: number): Promise<{
    destinations_created: number;
    bookings_made: number;
    reviews_written: number;
    joined_date: string;
  }> {
    const id = userId || authService.getCurrentUser()?.id;
    if (!id) throw new Error("User not authenticated");
    return apiMethods.get(`${this.baseUrl}/${id}/activity-stats`);
  }

  /* ✅ Export user data (GDPR-like endpoint) */
  async requestDataExport(): Promise<{ export_id: string; message: string }> {
    return apiMethods.post<{ export_id: string; message: string }>(
      `${this.baseUrl}/data-export`,
      {},
      {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      }
    );
  }

  /* ✅ Permanently delete user account */
  async deleteAccount(): Promise<{ message: string }> {
    return apiMethods.delete<{ message: string }>(`${this.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
  }
}

export default new UserService();
