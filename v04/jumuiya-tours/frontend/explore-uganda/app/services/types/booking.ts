import type { User } from "./auth";

/**
 * Booking status enum.
 */
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "rejected";

/**
 * Core Booking model as returned by API.
 */
export interface Booking {
  id: number;
  user_id: number;
  destination_id: number;
  guide_id?: number;
  start_date: string;      // ISO format
  end_date: string;        // ISO format
  num_people: number;
  total_price: number;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Optional nested relationships
  user?: Pick<User, "id" | "name" | "email">;
  destination?: {
    id: number;
    name: string;
    location: string;
    region?: string;
    images?: string[];
  };
  guide?: {
    id: number;
    user: {
      name: string;
      avatar?: string;
    };
  };
}

/**
 * Request body for creating a booking.
 */
export interface CreateBookingRequest {
  destination_id: number;
  guide_id?: number;
  start_date: string;
  end_date: string;
  num_people: number;
  notes?: string;
}

/**
 * Request for updating booking status.
 */
export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  admin_notes?: string;
}

/**
 * Paginated response wrapper for bookings.
 */
export interface BookingResponse {
  bookings: Booking[];
  pagination?: {
    page: number;
    pages: number;
    limit: number;
    total: number;
  };
}

