// app/services/moderation.service.ts
import type {
  ModerationLog,
  ModerationResponse,
  ModerationFilterParams,
} from "./moderation.types";

class ModerationService {
  private baseUrl = "/api/moderation";

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getPendingContent(params?: ModerationFilterParams): Promise<ModerationResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.content_type) query.append("content_type", params.content_type);
    if (params?.status) query.append("status", params.status);

    const response = await fetch(`${this.baseUrl}/pending?${query.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch content");
    return await response.json();
  }

  async getModerationRequest(id: number): Promise<{ moderationLog: ModerationLog }> {
    const res = await fetch(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch moderation request");
    return await res.json();
  }

  async approveContent(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/${id}/approve`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to approve content");
    return await res.json();
  }

  async rejectContent(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/${id}/reject`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to reject content");
    return await res.json();
  }

  async requestRevision(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/${id}/request-revision`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to request revision");
    return await res.json();
  }

  async getDashboardStats(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to load dashboard stats");
    return await res.json();
  }

  async submitContent(contentType: string, contentId: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/submit`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content_type: contentType, content_id: contentId }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to submit content");
    return await res.json();
  }
}

export const moderationService = new ModerationService();
export default ModerationService;
