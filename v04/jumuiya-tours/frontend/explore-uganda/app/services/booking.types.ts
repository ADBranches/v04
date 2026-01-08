export interface Booking {
  id: number;
  destination_id: number;
  user_id: number;
  guide_id?: number;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  destination: {
    id: number;
    name: string;
    region: string;
    description: string;
    price_range: string;
    district?: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  guide?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateBookingRequest {
  destination_id: number;
  booking_date: string;
  notes?: string;
}

export interface BookingResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface Destination {
  id: number;
  name: string;
  region: string;
  description: string;
  price_range: string;
  district?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';