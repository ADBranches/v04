// app/services/moderation.service.ts
import { apiService } from "./api-service";
import type {
  ModerationLog,
  ModerationResponse,
  ModerationFilterParams,
} from "./moderation.types";

interface ModerationQueueResponse {
  success: boolean;
  queue: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface DashboardStatsResponse {
  success: boolean;
  stats: {
    pending_destinations: number;
    pending_guides: number;
    pending_moderation: number;
    total_pending: number;
  };
  recent_activity?: any[];
}

class ModerationService {
  private baseUrl = "/moderation";

  /**
   * ✅ Load moderation queue using backend-supported filtered route
   * Backend expects:
   *   /moderation/queue/filtered?type=destination&status=pending&page=1&limit=20
   */
  async getPendingContent(
    params: ModerationFilterParams = {}
  ): Promise<ModerationResponse & { queue?: any[] }> {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      type: params.content_type || undefined, // map frontend content_type -> backend type
      status: params.status || "pending",
    };

    return await apiService.get<ModerationResponse & { queue?: any[] }>(
      `${this.baseUrl}/queue/filtered`,
      {
        params: queryParams,
      }
    );
  }

  /**
   * ✅ Get single moderation request
   */
  async getModerationRequest(id: number): Promise<{ moderationLog: ModerationLog }> {
    return await apiService.get<{ moderationLog: ModerationLog }>(
      `${this.baseUrl}/${id}`
    );
  }

  /**
   * ✅ Approve moderation item
   */
  async approveContent(
    id: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    return await apiService.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}/approve`,
      { notes }
    );
  }

  /**
   * ✅ Reject moderation item
   */
  async rejectContent(
    id: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    return await apiService.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}/reject`,
      { reason }
    );
  }

  /**
   * ✅ Request revision
   */
  async requestRevision(
    id: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    return await apiService.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}/request-revision`,
      { notes }
    );
  }

  /**
   * ✅ Generic moderation action wrapper
   * Used by ContentQueue
   */
  async moderateContent(
    id: number,
    action: string,
    payload: Record<string, any> = {}
  ) {
    if (!id) {
      throw new Error("Moderation item ID is required");
    }

    const normalizedAction = action.trim().toLowerCase();

    if (normalizedAction === "approve") {
      return await this.approveContent(id, payload.notes);
    }

    if (normalizedAction === "reject") {
      return await this.rejectContent(
        id,
        payload.reason || payload.notes || "Rejected by auditor"
      );
    }

    if (normalizedAction === "request-revision") {
      return await this.requestRevision(
        id,
        payload.notes || "Please revise and resubmit."
      );
    }

    throw new Error(`Unsupported moderation action: ${action}`);
  }

  /**
   * ✅ Raw dashboard stats response
   * Keeps compatibility with any existing callers using getDashboardStats()
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return await apiService.get<DashboardStatsResponse>(
      `${this.baseUrl}/dashboard/stats`
    );
  }

  /**
   * ✅ Mapped dashboard shape for AuditorDashboard component
   */
  async getDashboardData(): Promise<{
    pendingDestinations: number;
    approvedDestinations: number;
    rejectedDestinations: number;
    pendingGuides: number;
    verifiedGuides: number;
    totalReviewed: number;
  }> {
    const response = await this.getDashboardStats();

    return {
      pendingDestinations: response.stats?.pending_destinations || 0,
      approvedDestinations: 0, // backend does not currently return this
      rejectedDestinations: 0, // backend does not currently return this
      pendingGuides: response.stats?.pending_guides || 0,
      verifiedGuides: 0, // backend does not currently return this
      totalReviewed: response.stats?.total_pending || 0,
    };
  }

  /**
   * ✅ Submit content for moderation
   */
  async submitContent(
    contentType: string,
    contentId: number
  ): Promise<{ success: boolean; message: string }> {
    return await apiService.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/submit`,
      {
        content_type: contentType,
        content_id: contentId,
      }
    );
  }

  /**
   * ✅ Get moderation logs
   */
  async getModerationLogs(params: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}) {
    return await apiService.get(`${this.baseUrl}/logs/activity`, {
      params,
    });
  }

  /**
   * ✅ Alias for callers that may use a different method name
   */
  async getModerationItem(id: number) {
    return await this.getModerationRequest(id);
  }
}

const moderationService = new ModerationService();

export { moderationService };
export default moderationService;