// frontend/services/booking.service.ts
import type { Booking, BookingStatus, CreateBookingRequest } from "./booking.types";
import type { User } from "./types/auth";
import { authService } from "./auth.service";

export interface BookingResponse {
  bookings: Booking[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Centralized Booking Service
 * Handles secure authenticated requests + graceful error mapping
 */
class BookingService {
  private baseUrl = `${import.meta.env.VITE_API_BASE || "http://localhost:5000/api"}/bookings`;

  /** ✅ Unified header builder with defensive logging */
  private getAuthHeaders(): HeadersInit {
    const token = authService.getToken(); // ✅ Always use central token accessor
    const headers: HeadersInit = { "Content-Type": "application/json" };

    if (token) headers["Authorization"] = `Bearer ${token}`;
    else console.warn("⚠️ No auth token found in localStorage – request may be unauthorized");
    return headers;
  }

  /** ✅ Safely parse JSON response, otherwise fallback to text */
  private async safeJson(response: Response) {
    try {
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.warn("⚠️ Non-JSON API response:", text.slice(0, 200));
        return { error: `Unexpected response format`, raw: text };
      }
      return await response.json();
    } catch (err: any) {
      console.error("❌ Failed to parse response JSON:", err);
      return { error: "Malformed JSON response", raw: null };
    }
  }

  /** ✅ Centralized response handler for consistent error mapping */
  private async handleResponse(response: Response) {
    const data = await this.safeJson(response);
    if (!response.ok) {
      const readable =
        data.message ||
        data.error ||
        "An unexpected server error occurred. Please try again later.";

      console.error("🚨 Booking API error:", {
        status: response.status,
        url: response.url,
        message: readable,
        payload: data,
      });

      throw new Error(readable);
    }

    return data;
  }

  // ─── CREATE BOOKING ─────────────────────────────────────────────
  async createBooking(
    payload: CreateBookingRequest,
    _user?: User
  ): Promise<{ success: boolean; message: string; booking?: Booking }> {
    try {
      const storedUser = JSON.parse(localStorage.getItem("current_user") || "{}");
      const userId = _user?.id || storedUser?.id;

      const enrichedPayload = {
        destination_id: Number(payload.destination_id),
        booking_date: payload.start_date,
        number_of_people: Number(payload.num_people),
        special_requests: payload.notes?.trim() || null,
        user_id: userId,
      };

      console.info("📤 Sending booking payload:", enrichedPayload);

      if (!enrichedPayload.destination_id || !enrichedPayload.booking_date || !enrichedPayload.number_of_people) {
        throw new Error("Destination, booking date, and number of people are required before submission.");
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(enrichedPayload),
      });

      const data = await this.handleResponse(response);
      console.log("✅ Booking created successfully:", data.booking);

      return {
        success: true,
        message: data.message || "Booking created successfully.",
        booking: data.booking,
      };
    } catch (err: any) {
      console.error("🔥 Booking creation error:", err);
      throw new Error(err.message || "An unexpected error occurred during booking.");
    }
  }

  // ─── LIST BOOKINGS ─────────────────────────────────────────────
  async getBookings(params?: {
    status?: BookingStatus;
    page?: number;
    limit?: number;
    user_id?: number;
    region?: string;
  }): Promise<BookingResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.user_id) query.append("user_id", params.user_id.toString());
      if (params?.region) query.append("region", params.region);

      const url = `${this.baseUrl}?${query.toString()}`;
      console.log("🔍 Fetching bookings from:", url);

      const response = await fetch(url, { headers: this.getAuthHeaders() });
      const data = await this.handleResponse(response);

      console.info(`✅ Bookings fetched: ${data?.bookings?.length || 0}`);
      return data;
    } catch (err: any) {
      console.error("🔥 Failed to fetch bookings:", err);
      throw new Error(err.message || "Failed to fetch bookings.");
    }
  }

  // ─── MY BOOKINGS (current logged-in user) ─────────────────────
  async getMyBookings(): Promise<BookingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/my-bookings`, {
        headers: this.getAuthHeaders(),
      });

      const data: any = await this.handleResponse(response);

      // Backend returns: { success, bookings, count }
      // Normalize into BookingResponse shape used on frontend
      return {
        bookings: data.bookings ?? [],
        total: typeof data.count === "number" ? data.count : data.bookings?.length ?? 0,
        page: 1,
        limit: typeof data.count === "number" ? data.count : data.bookings?.length ?? 0,
      };
    } catch (err: any) {
      console.error("🔥 Failed to fetch my bookings:", err);
      throw new Error(err.message || "Failed to fetch your bookings.");
    }
  }

  // ─── GET BOOKING ───────────────────────────────────────────────
  async getBooking(id: number | string): Promise<Booking> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      console.info(`📦 Booking [${id}] loaded successfully.`);
      return data.booking;
    } catch (err: any) {
      console.error(`🔥 Error fetching booking [${id}]:`, err);
      throw new Error(err.message || "Failed to fetch booking.");
    }
  }

  // ─── UPDATE NOTES ──────────────────────────────────────────────
  async updateBooking(id: number, notes: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
      });
      const data = await this.handleResponse(response);
      console.info(`📝 Booking [${id}] notes updated successfully.`);
      return { success: true, message: data.message || "Booking updated successfully." };
    } catch (err: any) {
      console.error(`🔥 Failed to update booking [${id}]:`, err);
      throw new Error(err.message || "Failed to update booking.");
    }
  }

  // ─── STATUS UPDATE ─────────────────────────────────────────────
  async updateStatus(
    id: number | string,
    status: BookingStatus,
    admin_notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, admin_notes }),
      });
      const data = await this.handleResponse(response);
      console.info(`🔄 Booking [${id}] status updated to '${status}'.`);
      return { success: true, message: data.message || "Booking status updated." };
    } catch (err: any) {
      console.error(`🔥 Failed to update status for booking [${id}]:`, err);
      throw new Error(err.message || "Failed to update booking status.");
    }
  }

  // ─── CONFIRM ───────────────────────────────────────────────────
  async confirmBooking(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/confirm`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      console.info(`✅ Booking [${id}] confirmed.`);
      return { success: true, message: data.message || "Booking confirmed successfully." };
    } catch (err: any) {
      console.error(`🔥 Failed to confirm booking [${id}]:`, err);
      throw new Error(err.message || "Failed to confirm booking.");
    }
  }

  // ─── CANCEL ────────────────────────────────────────────────────
  async cancelBooking(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/cancel`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse(response);
      console.info(`❌ Booking [${id}] cancelled.`);
      return { success: true, message: data.message || "Booking cancelled successfully." };
    } catch (err: any) {
      console.error(`🔥 Failed to cancel booking [${id}]:`, err);
      throw new Error(err.message || "Failed to cancel booking.");
    }
  }
}

export const bookingService = new BookingService();
export default bookingService;
